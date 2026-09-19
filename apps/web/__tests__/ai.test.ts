import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { demoDb } from "@campusos/db";
import {
  AiProvider,
  GoogleGenAiProvider,
  DemoAiProvider,
  getAiProvider,
  AiToolRegistry,
  defaultAiToolRegistry,
  AiActionService,
  defaultAiActionService,
  AiConversationService,
  defaultAiConversationService,
  summarizeEvent,
  generateEventDescription,
  createStudyPlan,
  summarizeTasks,
  naturalLanguageScheduleLookup,
  campusEventSearch,
  generateAnnouncement,
  executeToolCalling,
  sanitizePrompt,
  sanitizeContext,
  containsSensitiveData,
  RateLimiter,
  validateInputSafeguards,
  validateToolCallSafeguards,
  withFailureRecovery,
  RateLimitExceededError,
  TokenLimitExceededError,
  ToolCallLimitExceededError,
  EventSummarySchema,
  EventDescriptionSchema,
  StudyPlanSchema,
  TaskSummarySchema,
  ScheduleLookupSchema,
  EventSearchResultSchema,
  AnnouncementSchema,
} from "@campusos/ai";
import { POST as chatHandler } from "../app/api/ai/chat/route";

const TEST_STUDENT_ID = "a1111111-1111-4111-8111-111111111111";

function makeRequest(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): NextRequest {
  const headers: Record<string, string> = {
    "x-test-user-id": TEST_STUDENT_ID,
    "content-type": "application/json",
    ...options.headers,
  };
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options.method || "POST",
    headers,
    body: options.body,
  });
}

describe("Security & Redaction Safeguards", () => {
  it("should redact raw database credentials from prompts", () => {
    const prompt = "Connect to postgresql://admin:secretPass123@db.internal:5432/campusos";
    const sanitized = sanitizePrompt(prompt);
    assert.equal(sanitized.includes("secretPass123"), false);
    assert.ok(sanitized.includes("[REDACTED_DB_CREDENTIALS]"));
  });

  it("should redact OAuth refresh tokens and Bearer auth headers", () => {
    const prompt = "Use token mock_rt_abc123xyz and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeak";
    const sanitized = sanitizePrompt(prompt);
    assert.equal(sanitized.includes("mock_rt_abc123xyz"), false);
    assert.ok(sanitized.includes("[REDACTED_OAUTH_TOKEN]"));
    assert.ok(sanitized.includes("Bearer [REDACTED_TOKEN]") || sanitized.includes("[REDACTED_JWT_TOKEN]"));
  });

  it("should scrub sensitive keys from context objects", () => {
    const rawContext = {
      userId: "u-123",
      email: "student@campusos.edu",
      encryptedRefreshToken: "0123456789abcdef:fedcba9876543210:secretcipherdata",
      password: "SuperSecretPassword!",
      keySecret: "rzp_secret_9999",
      sessionCookie: "campusos_session=valid",
      userProfile: {
        fullName: "Jane Doe",
        accessToken: "ya29.a0AfH6SMA...",
      },
    };

    const sanitized = sanitizeContext(rawContext);
    assert.equal(sanitized.userId, "u-123");
    assert.equal(sanitized.email, "student@campusos.edu");
    assert.equal(sanitized.encryptedRefreshToken, "[REDACTED_CREDENTIAL]");
    assert.equal(sanitized.password, "[REDACTED_CREDENTIAL]");
    assert.equal(sanitized.keySecret, "[REDACTED_CREDENTIAL]");
    assert.equal(sanitized.userProfile.accessToken, "[REDACTED_CREDENTIAL]");
  });

  it("should detect presence of sensitive patterns", () => {
    assert.equal(containsSensitiveData("Normal query about CS601"), false);
    assert.equal(containsSensitiveData("Bearer ya29.test123456"), true);
  });
});

describe("Token/Rate Safeguards & Failure Recovery", () => {
  it("should enforce rate limiting with sliding window", () => {
    const limiter = new RateLimiter(3, 60); // 3 requests per minute
    const key = "user_test_rate";

    assert.equal(limiter.check(key).allowed, true);
    assert.equal(limiter.check(key).allowed, true);
    assert.equal(limiter.check(key).allowed, true);
    assert.equal(limiter.check(key).allowed, false);

    assert.throws(() => limiter.assertAllowed(key), RateLimitExceededError);
  });

  it("should reject prompts exceeding maximum character/token safeguards", () => {
    const hugePrompt = "A".repeat(20000);
    assert.throws(() => validateInputSafeguards(hugePrompt, 16000), TokenLimitExceededError);
  });

  it("should enforce maximum tool calls per request safeguard", () => {
    assert.throws(() => validateToolCallSafeguards(6, 5), ToolCallLimitExceededError);
    assert.doesNotThrow(() => validateToolCallSafeguards(3, 5));
  });

  it("should recover from transient failures using retry and fallback", async () => {
    let attempts = 0;
    const failingOp = async () => {
      attempts++;
      if (attempts < 2) {
        const err: any = new Error("fetch failed");
        err.status = 503;
        throw err;
      }
      return "recovered_value";
    };

    const result = await withFailureRecovery(failingOp, { maxRetries: 3, initialDelayMs: 10 });
    assert.equal(result, "recovered_value");
    assert.equal(attempts, 2);
  });

  it("should execute fallback when all retries are exhausted", async () => {
    const permFail = async () => {
      const err: any = new Error("quotaExceeded");
      err.status = 429;
      throw err;
    };

    const result = await withFailureRecovery(permFail, {
      maxRetries: 1,
      initialDelayMs: 10,
      fallback: () => "safe_fallback_response",
    });
    assert.equal(result, "safe_fallback_response");
  });
});

describe("AiProvider Abstraction", () => {
  it("should provide DemoAiProvider when no API key or forced demo", () => {
    const provider = getAiProvider({ forceDemo: true });
    assert.equal(provider.providerName, "demo_ai");
    assert.ok(provider instanceof DemoAiProvider);
  });

  it("should instantiate GoogleGenAiProvider when API key is provided", () => {
    const provider = new GoogleGenAiProvider("test_gemini_key", "gemini-2.5-flash");
    assert.equal(provider.providerName, "google_genai");
    assert.ok(provider instanceof GoogleGenAiProvider);
  });

  it("should generate text and structured output with validation", async () => {
    const provider = new DemoAiProvider();
    const text = await provider.generateText("Hello CampusOS");
    assert.ok(text.includes("CampusOS Demo AI"));

    const summary = await provider.generateStructured(
      "Summarize hackathon",
      EventSummarySchema,
      { schemaName: "EventSummary" }
    );
    assert.equal(summary.title, "CampusHack 2026: AI & Edge Systems");
    assert.ok(summary.keyHighlights.length > 0);
  });
});

describe("AiToolRegistry & Action Safeguards", () => {
  it("should have approved default application tools registered", () => {
    const registry = new AiToolRegistry();
    const tools = registry.getAllTools();
    assert.ok(tools.length >= 7);

    assert.ok(registry.getTool("search_campus_events"));
    assert.ok(registry.getTool("lookup_schedule"));
    assert.ok(registry.getTool("get_my_tasks"));
    assert.ok(registry.getTool("create_task"));
    assert.ok(registry.getTool("add_event_to_calendar"));
    assert.ok(registry.getTool("register_for_event"));
    assert.ok(registry.getTool("send_announcement_email"));
  });

  it("should execute read-only tools safely", async () => {
    const registry = new AiToolRegistry();
    const result = await registry.executeTool(
      "search_campus_events",
      { query: "Hack" },
      { userId: TEST_STUDENT_ID, db: demoDb }
    );
    assert.equal(result.success, true);
    assert.ok(Array.isArray(result.result));
  });

  it("should validate tool parameters with Zod schema and reject invalid args", async () => {
    const registry = new AiToolRegistry();
    const result = await registry.executeTool(
      "send_announcement_email",
      { toEmail: "not-an-email", title: "Test", body: "Hello" },
      { userId: TEST_STUDENT_ID }
    );
    assert.equal(result.success, false);
    assert.ok(result.error!.includes("Invalid parameters"));
  });
});

describe("AiActionService - Confirmation Flow & Action Logging", () => {
  it("should require confirmation for mutating actions", async () => {
    const service = new AiActionService();
    const action = await service.proposeAction(
      "conv_test_1",
      {
        id: "call-1",
        toolName: "create_task",
        parameters: { title: "Study Raft consensus" },
        isMutating: true,
        requiresConfirmation: true,
      },
      demoDb
    );

    assert.equal(action.confirmationStatus, "PENDING");
    assert.equal(action.isMutating, true);

    // Attempting to execute without confirmation must fail
    const unconfirmed = await service.executeAction(
      action.id,
      { userId: TEST_STUDENT_ID },
      false,
      demoDb
    );
    assert.equal(unconfirmed.success, false);
    assert.ok(unconfirmed.error!.includes("requires user confirmation"));

    // Approving and executing the action
    const confirmed = await service.approveAndExecute(
      action.id,
      { userId: TEST_STUDENT_ID },
      demoDb
    );
    assert.equal(confirmed.success, true);
    assert.ok(confirmed.result.taskId);

    const updated = service.getActionById(action.id, demoDb);
    assert.equal(updated?.confirmationStatus, "APPROVED");
    assert.ok(updated?.executedAt);
  });

  it("should allow rejecting a pending action", async () => {
    const service = new AiActionService();
    const action = await service.proposeAction(
      "conv_test_2",
      {
        id: "call-2",
        toolName: "register_for_event",
        parameters: { eventId: "e1111111-1111-4111-8111-111111111111" },
        isMutating: true,
        requiresConfirmation: true,
      },
      demoDb
    );

    const rej = await service.rejectAction(action.id, { userId: TEST_STUDENT_ID }, demoDb);
    assert.equal(rej.success, true);

    const updated = service.getActionById(action.id, demoDb);
    assert.equal(updated?.confirmationStatus, "REJECTED");
  });
});

describe("8 Core CampusOS AI Capabilities", () => {
  const provider = new DemoAiProvider();

  it("Capability 1: summarize event", async () => {
    const eventData = {
      title: "CampusHack 2026",
      category: "Technical",
      venue: "Turing Hall",
    };
    const summary = await summarizeEvent(eventData, { provider });
    assert.ok(EventSummarySchema.parse(summary));
    assert.equal(summary.title, "CampusHack 2026: AI & Edge Systems");
    assert.ok(summary.keyHighlights.length >= 1);
    assert.ok(summary.schedule.venue);
  });

  it("Capability 2: generate event description", async () => {
    const desc = await generateEventDescription(
      {
        title: "CampusHack 2026",
        category: "Technical",
        venue: "Turing Innovation Hall",
        date: "2026-10-15",
      },
      { provider }
    );
    assert.ok(EventDescriptionSchema.parse(desc));
    assert.ok(desc.fullDescription.length > 10);
    assert.ok(desc.whoShouldAttend.length > 0);
  });

  it("Capability 3: create study plan", async () => {
    const plan = await createStudyPlan(
      {
        courseOrTopic: "Distributed Systems",
        targetGoal: "Master consensus protocols",
        totalWeeks: 4,
        availableHoursPerWeek: 10,
      },
      { provider }
    );
    assert.ok(StudyPlanSchema.parse(plan));
    assert.equal(plan.totalWeeks, 4);
    assert.ok(plan.phases.length > 0);
    assert.ok(plan.phases[0].weeklyPlan.length > 0);
  });

  it("Capability 4: summarize tasks", async () => {
    const tasks = [
      { id: "t-1", title: "Submit Assignment 3", priority: "URGENT", dueDate: "2026-09-20" },
      { id: "t-2", title: "Study for Quiz", priority: "HIGH" },
    ];
    const summary = await summarizeTasks(tasks, { provider });
    assert.ok(TaskSummarySchema.parse(summary));
    assert.ok(summary.totalTasks >= 0);
    assert.ok(summary.recommendedNextAction);
  });

  it("Capability 5: natural language schedule lookup", async () => {
    const lookup = await naturalLanguageScheduleLookup(
      "What is my schedule on Friday?",
      {
        date: "2026-09-21",
        events: [{ title: "CS601 Lecture", time: "10:00 AM" }],
      },
      { provider }
    );
    assert.ok(ScheduleLookupSchema.parse(lookup));
    assert.ok(lookup.items.length > 0);
    assert.ok(lookup.freeSlots.length > 0);
  });

  it("Capability 6: campus event search", async () => {
    const results = await campusEventSearch("hackathon", [], { provider });
    assert.ok(EventSearchResultSchema.parse(results));
    assert.ok(results.events.length > 0);
    assert.ok(results.events[0].title.includes("CampusHack"));
  });

  it("Capability 7: generate announcement", async () => {
    const ann = await generateAnnouncement(
      {
        topic: "Campus AI Launch",
        targetAudience: "ALL",
        urgency: "NORMAL",
        details: "New assistant available for students and faculty.",
      },
      { provider }
    );
    assert.ok(AnnouncementSchema.parse(ann));
    assert.ok(ann.headline);
    assert.ok(ann.publishChannels.includes("DASHBOARD"));
  });

  it("Capability 8: tool calling loop", async () => {
    const context = {
      userId: TEST_STUDENT_ID,
      db: demoDb,
    };
    const loopResult = await executeToolCalling(
      "Search for hackathons on campus",
      context,
      { provider }
    );
    assert.ok(loopResult.reply);
    assert.ok(loopResult.toolCallsExecuted.length > 0);
    assert.equal(loopResult.toolCallsExecuted[0].toolName, "search_campus_events");
  });
});

describe("AiConversationService & Multi-Turn Chat API", () => {
  it("should manage multi-turn conversation and message persistence", async () => {
    const convService = new AiConversationService();
    const conv = convService.createConversation(TEST_STUDENT_ID, "Course Planning");
    assert.ok(conv.id);

    // Turn 1
    const turn1 = await convService.sendMessage({
      conversationId: conv.id,
      userId: TEST_STUDENT_ID,
      userMessage: "What events are happening?",
    });
    assert.ok(turn1.reply);
    assert.ok(turn1.toolCallsExecuted.length > 0);

    // Turn 2
    const turn2 = await convService.sendMessage({
      conversationId: conv.id,
      userId: TEST_STUDENT_ID,
      userMessage: "Register me for the hackathon",
    });
    assert.ok(turn2.reply);
    // Mutating tool creates an action proposal requiring confirmation
    assert.ok(turn2.actionProposals.length > 0);
    assert.equal(turn2.actionProposals[0].toolName, "register_for_event");

    const messages = convService.getMessages(conv.id);
    assert.equal(messages.length, 4); // 2 user + 2 assistant messages
  });

  it("POST /api/ai/chat should process message via HTTP and return structured AI response", async () => {
    const req = makeRequest("http://localhost:3000/api/ai/chat", {
      body: JSON.stringify({
        message: "What is on my schedule tomorrow?",
      }),
    });

    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.reply);
    assert.ok(json.conversationId);
    assert.equal(json.isDemoFallback, true);
  });

  it("POST /api/ai/chat should support action approval flow", async () => {
    // Propose an action in DB
    const action = demoDb.createAiAction({
      conversationId: "conv_api_action_test",
      toolName: "create_task",
      parameters: { title: "API Action Approval Test" },
      isMutating: true,
      confirmationStatus: "PENDING",
    });

    const req = makeRequest("http://localhost:3000/api/ai/chat", {
      body: JSON.stringify({
        actionId: action.id,
        actionConfirmation: "APPROVE",
      }),
    });

    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.result.taskId);
  });
});
