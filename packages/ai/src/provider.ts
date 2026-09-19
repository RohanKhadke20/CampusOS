import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type {
  CampusAIMessage,
  AIResponse,
  AIToolCallProposal,
  AiToolDefinition,
} from "./types";
import { sanitizePrompt, sanitizeContext } from "./security";
import {
  globalAiRateLimiter,
  validateInputSafeguards,
  validateToolCallSafeguards,
  withFailureRecovery,
  DEFAULT_MAX_TOOL_CALLS,
} from "./safeguards";

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  userId?: string;
}

export interface AiProvider {
  readonly providerName: "google_genai" | "demo_ai";

  generateText(prompt: string, options?: GenerateOptions): Promise<string>;

  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: GenerateOptions & { schemaName?: string }
  ): Promise<T>;

  chat(
    messages: CampusAIMessage[],
    tools?: AiToolDefinition[],
    options?: GenerateOptions & { maxToolCalls?: number }
  ): Promise<AIResponse>;
}

/**
 * Live Google GenAI Provider using official @google/genai SDK
 */
export class GoogleGenAiProvider implements AiProvider {
  readonly providerName = "google_genai" as const;
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    if (options?.userId) {
      globalAiRateLimiter.assertAllowed(options.userId);
    }
    validateInputSafeguards(prompt);

    const safePrompt = sanitizePrompt(prompt);
    const safeInstruction = options?.systemInstruction
      ? sanitizePrompt(options.systemInstruction)
      : undefined;

    return withFailureRecovery(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: safePrompt,
        config: {
          systemInstruction: safeInstruction,
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxOutputTokens ?? 2048,
        },
      });

      return response.text?.trim() || "";
    });
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: GenerateOptions & { schemaName?: string }
  ): Promise<T> {
    if (options?.userId) {
      globalAiRateLimiter.assertAllowed(options.userId);
    }
    validateInputSafeguards(prompt);

    const safePrompt = sanitizePrompt(prompt);
    const systemPrompt = [
      options?.systemInstruction || "You are a university operating system assistant.",
      "Respond strictly with valid JSON conforming to the requested schema. Do not enclose in markdown code fences.",
    ].join("\n");

    return withFailureRecovery(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: safePrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxOutputTokens ?? 4096,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text?.trim() || "{}";
      // Handle potential markdown wrap
      const jsonText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      const parsedJson = JSON.parse(jsonText);

      // Validate output with Zod
      return schema.parse(parsedJson);
    });
  }

  async chat(
    messages: CampusAIMessage[],
    tools?: AiToolDefinition[],
    options?: GenerateOptions & { maxToolCalls?: number }
  ): Promise<AIResponse> {
    if (options?.userId) {
      globalAiRateLimiter.assertAllowed(options.userId);
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    validateInputSafeguards(lastMessage);

    // Build safe contents array
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: sanitizePrompt(m.content) }],
    }));

    const functionDeclarations = tools && tools.length > 0
      ? tools.map((t) => t.genAiDeclaration)
      : undefined;

    return withFailureRecovery(async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents as any,
        config: {
          systemInstruction: options?.systemInstruction || "You are the CampusOS AI University Assistant.",
          temperature: options?.temperature ?? 0.4,
          tools: functionDeclarations ? [{ functionDeclarations } as any] : undefined,
        },
      });

      const text = response.text || "";
      const rawCalls = (response as any).functionCalls || [];

      validateToolCallSafeguards(rawCalls.length, options?.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS);

      const toolCalls: AIToolCallProposal[] = [];
      const actionProposals: AIToolCallProposal[] = [];

      for (const call of rawCalls) {
        const toolDef = tools?.find((t) => t.name === call.name);
        const proposal: AIToolCallProposal = {
          id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          toolName: call.name,
          parameters: sanitizeContext(call.args || {}),
          isMutating: toolDef ? toolDef.isMutating : false,
          requiresConfirmation: toolDef ? toolDef.requiresConfirmation : false,
        };

        toolCalls.push(proposal);
        if (proposal.requiresConfirmation) {
          actionProposals.push(proposal);
        }
      }

      return {
        reply: text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        actionProposals: actionProposals.length > 0 ? actionProposals : undefined,
        isDemoFallback: false,
        modelUsed: this.model,
      };
    });
  }
}

/**
 * Deterministic Demo AI Provider for offline, sandbox, and mock environments
 */
export class DemoAiProvider implements AiProvider {
  readonly providerName = "demo_ai" as const;

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    if (options?.userId) {
      globalAiRateLimiter.assertAllowed(options.userId);
    }
    validateInputSafeguards(prompt);

    const safePrompt = sanitizePrompt(prompt);
    return `[CampusOS Demo AI] Response to: "${safePrompt.slice(0, 50)}...". Powered by CampusOS Intelligence.`;
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T, any, any>,
    options?: GenerateOptions & { schemaName?: string }
  ): Promise<T> {
    if (options?.userId) {
      globalAiRateLimiter.assertAllowed(options.userId);
    }
    validateInputSafeguards(prompt);

    const safePrompt = sanitizePrompt(prompt);
    const mockData = this.generateMockStructuredData(options?.schemaName || "", safePrompt);

    // Validate the generated mock structure
    return schema.parse(mockData as any);
  }

  async chat(
    messages: CampusAIMessage[],
    tools?: AiToolDefinition[],
    options?: GenerateOptions & { maxToolCalls?: number }
  ): Promise<AIResponse> {
    if (options?.userId) {
      globalAiRateLimiter.assertAllowed(options.userId);
    }

    const lastMsg = messages[messages.length - 1]?.content || "";
    validateInputSafeguards(lastMsg);
    const lower = lastMsg.toLowerCase();

    const toolCalls: AIToolCallProposal[] = [];
    const actionProposals: AIToolCallProposal[] = [];

    let reply = "I am the CampusOS AI Assistant running in Demo Sandbox Mode. I can help search events, inspect schedules, manage tasks, and draft announcements.";

    if (lower.includes("register") || lower.includes("sign up")) {
      const proposal: AIToolCallProposal = {
        id: `call_${Date.now()}_4`,
        toolName: "register_for_event",
        parameters: { eventId: "e1111111-1111-4111-8111-111111111111" },
        isMutating: true,
        requiresConfirmation: true,
      };
      toolCalls.push(proposal);
      actionProposals.push(proposal);
      reply = "I can register you for CampusHack 2026. Please confirm if you would like me to submit this registration.";
    } else if (lower.includes("schedule") || lower.includes("tomorrow") || lower.includes("friday")) {
      const proposal: AIToolCallProposal = {
        id: `call_${Date.now()}_2`,
        toolName: "lookup_schedule",
        parameters: { date: new Date().toISOString().slice(0, 10) },
        isMutating: false,
        requiresConfirmation: false,
      };
      toolCalls.push(proposal);
      reply = "Here is your timetable schedule for today: CS601 Distributed Systems Lecture at 10:00 AM, Turing Innovation Hall.";
    } else if (lower.includes("task") || lower.includes("todo") || lower.includes("homework")) {
      const proposal: AIToolCallProposal = {
        id: `call_${Date.now()}_3`,
        toolName: "get_my_tasks",
        parameters: { status: "TODO" },
        isMutating: false,
        requiresConfirmation: false,
      };
      toolCalls.push(proposal);
      reply = "You have 3 pending tasks: Complete Distributed Systems Assignment 3 (High priority), Review Computer Networks slides, and register for Hackathon.";
    } else if (lower.includes("event") || lower.includes("hackathon") || lower.includes("workshop")) {
      const proposal: AIToolCallProposal = {
        id: `call_${Date.now()}_1`,
        toolName: "search_campus_events",
        parameters: { query: "hackathon" },
        isMutating: false,
        requiresConfirmation: false,
      };
      toolCalls.push(proposal);
      reply = "I found several upcoming events on CampusOS, including CampusHack 2026. Would you like me to register you or add it to your calendar?";
    }

    validateToolCallSafeguards(toolCalls.length, options?.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS);

    return {
      reply,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      actionProposals: actionProposals.length > 0 ? actionProposals : undefined,
      isDemoFallback: true,
      modelUsed: "campusos-demo-sandbox",
    };
  }

  private generateMockStructuredData(schemaName: string, prompt: string): any {
    switch (schemaName) {
      case "EventSummary":
        return {
          title: "CampusHack 2026: AI & Edge Systems",
          oneLineSummary: "Annual flagship 36-hour hackathon focused on generative AI and IoT.",
          overview: "CampusHack 2026 brings together over 500 collegiate developers, designers, and researchers to build edge AI solutions.",
          keyHighlights: [
            "₹1,50,000 in cash prizes and cloud grants",
            "Mentorship from industry engineers",
            "Hardware kit provided for edge computing track",
          ],
          targetAudience: "Undergraduate and graduate students passionate about software and systems.",
          prerequisites: ["Laptop", "Student ID", "Basic programming proficiency"],
          schedule: {
            date: "2026-10-15",
            timeRange: "09:00 AM - Oct 16 09:00 PM",
            venue: "Turing Innovation Hall & Labs",
          },
        };

      case "EventDescription":
        return {
          title: "CampusHack 2026: AI & Edge Systems",
          tagline: "Code the Intelligent Campus of Tomorrow",
          fullDescription: "Join the premier university hackathon of the semester. Build next-generation applications leveraging Google GenAI, distributed systems, and edge devices. Collaborate in teams of up to 4 members.",
          keyHighlights: ["Keynote by AI researchers", "Hands-on workshops", "Networking dinner with sponsor tech leads"],
          whoShouldAttend: ["Developers", "UI/UX Designers", "Data Science students"],
          agenda: [
            { time: "09:00 AM", activity: "Check-in & Breakfast" },
            { time: "10:30 AM", activity: "Opening Ceremony & Problem Statements" },
            { time: "12:00 PM", activity: "Hacking Begins" },
          ],
          callToAction: "Register now to secure your ticket before spots fill up!",
        };

      case "StudyPlan":
        return {
          title: "Distributed Systems & Cloud Computing Mastery Plan",
          targetGoal: "Score top tier in final exams and build a production-grade project",
          totalWeeks: 4,
          weeklyHoursRecommended: 10,
          phases: [
            {
              phaseNumber: 1,
              name: "Consensus & Replication Fundamentals",
              focusTopics: ["Paxos", "Raft", "Two-Phase Commit"],
              milestones: ["Implement a simple Raft leader election prototype"],
              weeklyPlan: [
                {
                  week: 1,
                  tasks: ["Read Ongaro & Ousterhout Raft paper", "Watch lecture 4-6 on Paxos"],
                  deliverables: ["Summary notes on consensus safety invariants"],
                },
              ],
            },
            {
              phaseNumber: 2,
              name: "Fault Tolerance & Storage",
              focusTopics: ["Vector Clocks", "Eventual Consistency", "LSM-Trees"],
              milestones: ["Complete mock exam questions on split-brain scenarios"],
              weeklyPlan: [
                {
                  week: 2,
                  tasks: ["Review Dynamo paper", "Practice vector clock problem set"],
                  deliverables: ["Completed problem set 3"],
                },
              ],
            },
          ],
          studyTips: ["Focus on understanding failure models before implementation", "Group study for consensus walk-throughs"],
        };

      case "TaskSummary":
        return {
          totalTasks: 4,
          summary: "You have 4 active tasks. 1 is urgent and requires immediate attention before midnight.",
          priorityBreakdown: { urgent: 1, high: 1, medium: 2, low: 0 },
          overdueCount: 0,
          overdueTasks: [],
          upcomingTasks: [
            { id: "task-1", title: "Submit CS601 Assignment 3", priority: "URGENT", dueDate: "2026-09-20T23:59:00Z" },
            { id: "task-2", title: "Review DBMS Normalization notes", priority: "HIGH", dueDate: "2026-09-22T18:00:00Z" },
          ],
          recommendedNextAction: "Begin working on CS601 Assignment 3 to meet tonight's deadline.",
        };

      case "ScheduleLookup":
        return {
          query: prompt,
          matchedDate: "2026-09-21",
          items: [
            { time: "10:00 AM - 11:30 AM", title: "CS601 Distributed Systems", location: "Hall 101", type: "lecture", isConflict: false },
            { time: "02:00 PM - 03:30 PM", title: "CS602 Advanced Algorithms", location: "Hall 204", type: "lecture", isConflict: false },
          ],
          freeSlots: [
            { start: "11:30 AM", end: "02:00 PM", durationMinutes: 150 },
            { start: "03:30 PM", end: "06:00 PM", durationMinutes: 150 },
          ],
          summary: "You have 2 scheduled lectures on 2026-09-21 with a 2.5 hour free window between 11:30 AM and 02:00 PM.",
        };

      case "EventSearchResult":
        return {
          query: prompt,
          totalMatches: 2,
          events: [
            {
              id: "e1111111-1111-4111-8111-111111111111",
              title: "CampusHack 2026: AI & Edge Systems",
              slug: "campushack-2026",
              category: "Technical",
              venue: "Turing Innovation Hall",
              startTime: "2026-10-15T09:00:00Z",
              endTime: "2026-10-16T21:00:00Z",
              isPaid: false,
              organizationName: "ACM Student Chapter",
              relevanceExplanation: "Exact match for hackathon and AI systems search.",
            },
          ],
          summary: "Found 1 top matching event matching your search.",
        };

      case "Announcement":
        return {
          headline: "CampusOS AI Assistant Integration Live Across University Portal",
          targetAudience: "ALL",
          urgency: "NORMAL",
          body: "We are excited to launch the new CampusOS AI Assistant powered by Google GenAI. Students and faculty can now query schedules, discover campus events, and manage course deliverables with ease.",
          actionLabel: "Explore Campus AI",
          actionUrl: "http://localhost:3000/events",
          publishChannels: ["DASHBOARD", "EMAIL"],
        };

      default:
        return {};
    }
  }
}

/**
 * Factory function for creating the appropriate AiProvider.
 */
export function getAiProvider(options?: { apiKey?: string; forceDemo?: boolean }): AiProvider {
  if (options?.forceDemo) {
    return new DemoAiProvider();
  }

  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new DemoAiProvider();
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return new GoogleGenAiProvider(apiKey, model);
}
