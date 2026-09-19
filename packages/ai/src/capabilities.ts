import {
  EventSummarySchema,
  EventDescriptionSchema,
  StudyPlanSchema,
  TaskSummarySchema,
  ScheduleLookupSchema,
  EventSearchResultSchema,
  AnnouncementSchema,
  type EventSummary,
  type EventDescription,
  type StudyPlan,
  type TaskSummary,
  type ScheduleLookup,
  type EventSearchResult,
  type Announcement,
} from "./schemas";
import { AiProvider, getAiProvider } from "./provider";
import { sanitizePrompt, sanitizeContext } from "./security";
import { AiToolRegistry, defaultAiToolRegistry } from "./tools";
import { AiActionService, defaultAiActionService } from "./actions";
import type { ToolExecutionContext, AIToolCallProposal } from "./types";
import { validateToolCallSafeguards } from "./safeguards";

export interface CapabilityOptions {
  provider?: AiProvider;
  userId?: string;
}

// ---------------------------------------------------------------------------
// Capability 1: Summarize Event
// ---------------------------------------------------------------------------

export async function summarizeEvent(
  eventData: Record<string, any>,
  options?: CapabilityOptions
): Promise<EventSummary> {
  const provider = options?.provider || getAiProvider();
  const safeEvent = sanitizeContext(eventData);

  const prompt = [
    "Summarize the following campus event for students:",
    JSON.stringify(safeEvent, null, 2),
    "Provide an executive summary, key highlights, target audience, prerequisites, and formatted schedule.",
  ].join("\n");

  return provider.generateStructured(prompt, EventSummarySchema, {
    schemaName: "EventSummary",
    systemInstruction: "You are an expert university event analyst. Summarize campus events clearly and accurately.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 2: Generate Event Description
// ---------------------------------------------------------------------------

export interface GenerateDescriptionParams {
  title: string;
  category: string;
  venue: string;
  date: string;
  organizerName?: string;
  targetAudience?: string;
  keyThemes?: string[];
}

export async function generateEventDescription(
  params: GenerateDescriptionParams,
  options?: CapabilityOptions
): Promise<EventDescription> {
  const provider = options?.provider || getAiProvider();
  const safeParams = sanitizeContext(params);

  const prompt = [
    "Generate an engaging, professional campus event description from these parameters:",
    JSON.stringify(safeParams, null, 2),
    "Create an attention-grabbing tagline, comprehensive description, highlights, who should attend, sample agenda, and call to action.",
  ].join("\n");

  return provider.generateStructured(prompt, EventDescriptionSchema, {
    schemaName: "EventDescription",
    systemInstruction: "You are a university event marketing and communications director. Write compelling event copy.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 3: Create Study Plan
// ---------------------------------------------------------------------------

export interface StudyPlanParams {
  courseOrTopic: string;
  targetGoal: string;
  totalWeeks: number;
  availableHoursPerWeek: number;
  knownWeakAreas?: string[];
}

export async function createStudyPlan(
  params: StudyPlanParams,
  options?: CapabilityOptions
): Promise<StudyPlan> {
  const provider = options?.provider || getAiProvider();
  const safeParams = sanitizeContext(params);

  const prompt = [
    "Create a realistic, structured, phased study plan for a university student based on these inputs:",
    JSON.stringify(safeParams, null, 2),
    "Divide the plan into sequential learning phases with milestone checkpoints, weekly tasks, deliverables, and practical study tips.",
  ].join("\n");

  return provider.generateStructured(prompt, StudyPlanSchema, {
    schemaName: "StudyPlan",
    systemInstruction: "You are an academic advisor and cognitive learning specialist. Design realistic, actionable study plans.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 4: Summarize Tasks
// ---------------------------------------------------------------------------

export async function summarizeTasks(
  tasks: Array<Record<string, any>>,
  options?: CapabilityOptions
): Promise<TaskSummary> {
  const provider = options?.provider || getAiProvider();
  const safeTasks = sanitizeContext(tasks);

  const prompt = [
    "Analyze and summarize this list of student tasks:",
    JSON.stringify(safeTasks, null, 2),
    "Provide a priority breakdown (urgent, high, medium, low), count overdue items, identify upcoming deadlines, and recommend the single most important next action.",
  ].join("\n");

  return provider.generateStructured(prompt, TaskSummarySchema, {
    schemaName: "TaskSummary",
    systemInstruction: "You are an executive productivity assistant. Organize and prioritize student coursework and projects.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 5: Natural Language Schedule Lookup
// ---------------------------------------------------------------------------

export async function naturalLanguageScheduleLookup(
  naturalQuery: string,
  scheduleContext: {
    date: string;
    events: Array<Record<string, any>>;
    tasks?: Array<Record<string, any>>;
  },
  options?: CapabilityOptions
): Promise<ScheduleLookup> {
  const provider = options?.provider || getAiProvider();
  const safeQuery = sanitizePrompt(naturalQuery);
  const safeContext = sanitizeContext(scheduleContext);

  const prompt = [
    `User Query: "${safeQuery}"`,
    "Schedule context data for student:",
    JSON.stringify(safeContext, null, 2),
    "Match the schedule entries, identify free slots, detect any overlaps or conflicts, and answer the user's inquiry with a clear summary.",
  ].join("\n");

  return provider.generateStructured(prompt, ScheduleLookupSchema, {
    schemaName: "ScheduleLookup",
    systemInstruction: "You are a university schedule coordination assistant. Parse timetables and free slots accurately.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 6: Campus Event Search
// ---------------------------------------------------------------------------

export async function campusEventSearch(
  searchQuery: string,
  eventsDatabase: Array<Record<string, any>>,
  options?: CapabilityOptions
): Promise<EventSearchResult> {
  const provider = options?.provider || getAiProvider();
  const safeQuery = sanitizePrompt(searchQuery);
  const safeEvents = sanitizeContext(eventsDatabase);

  const prompt = [
    `Search Query: "${safeQuery}"`,
    "Available campus events list:",
    JSON.stringify(safeEvents, null, 2),
    "Find matching events, rank by relevance, explain why each event matches the user's intent, and provide a helpful summary.",
  ].join("\n");

  return provider.generateStructured(prompt, EventSearchResultSchema, {
    schemaName: "EventSearchResult",
    systemInstruction: "You are a campus event search specialist. Match student inquiries with relevant campus events.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 7: Generate Announcement
// ---------------------------------------------------------------------------

export interface AnnouncementParams {
  topic: string;
  targetAudience: "ALL" | "STUDENTS" | "ORGANIZERS" | "FACULTY";
  urgency?: "NORMAL" | "HIGH" | "URGENT";
  details: string;
  actionUrl?: string;
  actionLabel?: string;
}

export async function generateAnnouncement(
  params: AnnouncementParams,
  options?: CapabilityOptions
): Promise<Announcement> {
  const provider = options?.provider || getAiProvider();
  const safeParams = sanitizeContext(params);

  const prompt = [
    "Draft an official university announcement with the following requirements:",
    JSON.stringify(safeParams, null, 2),
    "Write a clear headline, appropriate urgency level, informative body text, recommended broadcast channels, and call to action.",
  ].join("\n");

  return provider.generateStructured(prompt, AnnouncementSchema, {
    schemaName: "Announcement",
    systemInstruction: "You are the campus official communications officer. Draft clear, professional announcements.",
    userId: options?.userId,
  });
}

// ---------------------------------------------------------------------------
// Capability 8: Tool Calling
// ---------------------------------------------------------------------------

export interface ToolCallingLoopResult {
  reply: string;
  toolCallsExecuted: Array<{ toolName: string; result: any }>;
  actionProposals: AIToolCallProposal[];
  isDemoFallback: boolean;
}

export async function executeToolCalling(
  userPrompt: string,
  context: ToolExecutionContext,
  options?: {
    provider?: AiProvider;
    registry?: AiToolRegistry;
    actionService?: AiActionService;
    maxToolCalls?: number;
    conversationId?: string;
  }
): Promise<ToolCallingLoopResult> {
  const provider = options?.provider || getAiProvider();
  const registry = options?.registry || defaultAiToolRegistry;
  const actionService = options?.actionService || defaultAiActionService;
  const maxToolCalls = options?.maxToolCalls || 5;

  const safePrompt = sanitizePrompt(userPrompt);
  const tools = registry.getAllTools();

  // Call the model with tool declarations
  const chatResponse = await provider.chat(
    [{ role: "user", content: safePrompt }],
    tools,
    { maxToolCalls, userId: context.userId }
  );

  const proposedCalls = chatResponse.toolCalls || [];
  validateToolCallSafeguards(proposedCalls.length, maxToolCalls);

  const toolCallsExecuted: Array<{ toolName: string; result: any }> = [];
  const actionProposals: AIToolCallProposal[] = [];

  for (const call of proposedCalls) {
    const toolDef = registry.getTool(call.toolName);
    if (!toolDef) continue;

    if (toolDef.isMutating && toolDef.requiresConfirmation && !context.skipConfirmation) {
      // Mutating actions require explicit user confirmation - propose through action service
      if (options?.conversationId) {
        await actionService.proposeAction(options.conversationId, call, context.db);
      }
      actionProposals.push(call);
    } else {
      // Read-only queries execute through approved tool registry
      const exec = await registry.executeTool(call.toolName, call.parameters, context);
      toolCallsExecuted.push({ toolName: call.toolName, result: exec.result });
    }
  }

  return {
    reply: chatResponse.reply,
    toolCallsExecuted,
    actionProposals,
    isDemoFallback: chatResponse.isDemoFallback,
  };
}
