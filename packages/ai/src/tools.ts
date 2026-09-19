import { Type } from "@google/genai";
import { z } from "zod";
import { demoDb } from "@campusos/db";
import type { ToolExecutionContext, AiToolDefinition } from "./types";
import { sanitizeContext } from "./security";

/**
 * AiToolRegistry: Central registry of approved application tools.
 * External actions MUST execute through approved application tools.
 */
export class AiToolRegistry {
  private tools = new Map<string, AiToolDefinition>();

  constructor() {
    this.registerDefaultTools();
  }

  registerTool(tool: AiToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AiToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): AiToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getFunctionDeclarations() {
    return this.getAllTools().map((t) => t.genAiDeclaration);
  }

  async executeTool(
    name: string,
    rawArgs: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' is not recognized in approved application tools registry.`,
      };
    }

    // Validate parameters with Zod schema
    const parseResult = tool.parametersSchema.safeParse(rawArgs);
    if (!parseResult.success) {
      return {
        success: false,
        error: `Invalid parameters for tool '${name}': ${JSON.stringify(parseResult.error.format())}`,
      };
    }

    try {
      const db = context.db || demoDb;
      const result = await tool.execute(parseResult.data, { ...context, db });
      // Sanitize tool output before it could ever be fed back to a model
      return {
        success: true,
        result: sanitizeContext(result),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }

  private registerDefaultTools(): void {
    // 1. search_campus_events (Read-only)
    this.registerTool({
      name: "search_campus_events",
      description: "Search for campus events, workshops, hackathons, and seminars by keyword, category, or status.",
      isMutating: false,
      requiresConfirmation: false,
      parametersSchema: z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        isPaid: z.boolean().optional(),
      }),
      genAiDeclaration: {
        name: "search_campus_events",
        description: "Search for campus events, workshops, hackathons, and seminars by keyword, category, or status.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Keyword to search in event titles and descriptions" },
            category: { type: Type.STRING, description: "Filter by event category, e.g. Technical, Cultural, Sports" },
            isPaid: { type: Type.BOOLEAN, description: "Filter by whether event is paid or free" },
          },
        },
      },
      execute: async (args, ctx) => {
        const db = ctx.db || demoDb;
        const allEvents = db.getEvents();
        let filtered = allEvents;
        if (args.query) {
          const q = args.query.toLowerCase();
          filtered = filtered.filter(
            (e: any) =>
              e.title?.toLowerCase().includes(q) ||
              e.description?.toLowerCase().includes(q) ||
              e.category?.toLowerCase().includes(q)
          );
        }
        if (args.category) {
          filtered = filtered.filter(
            (e: any) => e.category?.toLowerCase() === args.category.toLowerCase()
          );
        }
        if (args.isPaid !== undefined) {
          filtered = filtered.filter((e: any) => Boolean(e.isPaid) === args.isPaid);
        }
        return filtered.slice(0, 10).map((e: any) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          category: e.category,
          venue: e.venue,
          startTime: e.startTime,
          endTime: e.endTime,
          isPaid: e.isPaid,
          status: e.status,
        }));
      },
    });

    // 2. lookup_schedule (Read-only)
    this.registerTool({
      name: "lookup_schedule",
      description: "Look up student or campus schedule and calendar entries for a specific date (YYYY-MM-DD).",
      isMutating: false,
      requiresConfirmation: false,
      parametersSchema: z.object({
        date: z.string(),
      }),
      genAiDeclaration: {
        name: "lookup_schedule",
        description: "Look up student or campus schedule and calendar entries for a specific date (YYYY-MM-DD).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "Date to inspect in YYYY-MM-DD format" },
          },
          required: ["date"],
        },
      },
      execute: async (args, ctx) => {
        const db = ctx.db || demoDb;
        const targetDate = args.date;
        const events = db.getEvents().filter((e: any) => e.startTime?.startsWith(targetDate));
        const tasks = db.getTasks().filter((t: any) => t.dueDate?.startsWith(targetDate));
        return {
          date: targetDate,
          scheduledEvents: events.map((e: any) => ({
            id: e.id,
            title: e.title,
            time: `${e.startTime} - ${e.endTime}`,
            venue: e.venue,
          })),
          tasksDue: tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
          })),
        };
      },
    });

    // 3. get_my_tasks (Read-only)
    this.registerTool({
      name: "get_my_tasks",
      description: "Get the current student's task list, optionally filtered by status (TODO, IN_PROGRESS, REVIEW, DONE).",
      isMutating: false,
      requiresConfirmation: false,
      parametersSchema: z.object({
        status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
      }),
      genAiDeclaration: {
        name: "get_my_tasks",
        description: "Get the current student's task list, optionally filtered by status.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "Task status: TODO, IN_PROGRESS, REVIEW, or DONE" },
          },
        },
      },
      execute: async (args, ctx) => {
        const db = ctx.db || demoDb;
        let tasks = db.getTasks();
        if (ctx.userId) {
          tasks = tasks.filter((t: any) => t.userId === ctx.userId);
        }
        if (args.status) {
          tasks = tasks.filter((t: any) => t.status === args.status);
        }
        return tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
        }));
      },
    });

    // 4. create_task (Mutating, requires confirmation)
    this.registerTool({
      name: "create_task",
      description: "Create a new student study or project task.",
      isMutating: true,
      requiresConfirmation: true,
      parametersSchema: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        dueDate: z.string().optional(),
      }),
      genAiDeclaration: {
        name: "create_task",
        description: "Create a new student study or project task.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Task title" },
            description: { type: Type.STRING, description: "Task description or details" },
            priority: { type: Type.STRING, description: "Priority: LOW, MEDIUM, HIGH, URGENT" },
            dueDate: { type: Type.STRING, description: "ISO 8601 due date string" },
          },
          required: ["title"],
        },
      },
      execute: async (args, ctx) => {
        const db = ctx.db || demoDb;
        const task = db.createTask({
          userId: ctx.userId,
          title: args.title,
          description: args.description,
          priority: args.priority,
          status: "TODO",
          dueDate: args.dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
        });
        return {
          taskId: task.id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
          message: "Task created successfully.",
        };
      },
    });

    // 5. add_event_to_calendar (Mutating, requires confirmation)
    this.registerTool({
      name: "add_event_to_calendar",
      description: "Schedule an event or study session on the user's primary calendar.",
      isMutating: true,
      requiresConfirmation: true,
      parametersSchema: z.object({
        title: z.string().min(1),
        startTime: z.string(),
        endTime: z.string(),
        location: z.string().optional(),
        description: z.string().optional(),
      }),
      genAiDeclaration: {
        name: "add_event_to_calendar",
        description: "Schedule an event or study session on the user's primary calendar.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Calendar event title" },
            startTime: { type: Type.STRING, description: "Start time in ISO format" },
            endTime: { type: Type.STRING, description: "End time in ISO format" },
            location: { type: Type.STRING, description: "Venue or room location" },
            description: { type: Type.STRING, description: "Description or notes" },
          },
          required: ["title", "startTime", "endTime"],
        },
      },
      execute: async (args, ctx) => {
        return {
          eventId: `cal-${Date.now()}`,
          title: args.title,
          startTime: args.startTime,
          endTime: args.endTime,
          location: args.location,
          scheduled: true,
          message: `Scheduled "${args.title}" on user calendar.`,
        };
      },
    });

    // 6. register_for_event (Mutating, requires confirmation)
    this.registerTool({
      name: "register_for_event",
      description: "Register the authenticated user for a specific campus event.",
      isMutating: true,
      requiresConfirmation: true,
      parametersSchema: z.object({
        eventId: z.string(),
        ticketId: z.string().optional(),
      }),
      genAiDeclaration: {
        name: "register_for_event",
        description: "Register the authenticated user for a specific campus event.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            eventId: { type: Type.STRING, description: "Event ID to register for" },
            ticketId: { type: Type.STRING, description: "Optional ticket ID" },
          },
          required: ["eventId"],
        },
      },
      execute: async (args, ctx) => {
        const db = ctx.db || demoDb;
        const reg = db.registerForEvent({
          userId: ctx.userId,
          eventId: args.eventId,
          ticketId: args.ticketId || "default-ticket",
        });
        return {
          registrationId: reg.id,
          registrationNumber: reg.registrationNumber,
          status: reg.status,
          message: "Registration successfully recorded.",
        };
      },
    });

    // 7. send_announcement_email (Mutating, requires confirmation)
    this.registerTool({
      name: "send_announcement_email",
      description: "Send an official announcement email to a student or group via approved Gmail outbound service.",
      isMutating: true,
      requiresConfirmation: true,
      parametersSchema: z.object({
        toEmail: z.string().email(),
        title: z.string().min(1),
        body: z.string().min(1),
        actionUrl: z.string().optional(),
      }),
      genAiDeclaration: {
        name: "send_announcement_email",
        description: "Send an official announcement email to a student or group via approved Gmail outbound service.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            toEmail: { type: Type.STRING, description: "Recipient email address" },
            title: { type: Type.STRING, description: "Announcement headline / subject" },
            body: { type: Type.STRING, description: "Announcement message content" },
            actionUrl: { type: Type.STRING, description: "Optional call to action link" },
          },
          required: ["toEmail", "title", "body"],
        },
      },
      execute: async (args, ctx) => {
        const db = ctx.db || demoDb;
        const msg = db.createGmailMessage({
          userId: ctx.userId,
          messageId: `ai_announcement_${Date.now()}`,
          toEmail: args.toEmail,
          subject: args.title,
          templateType: "announcement",
          provider: "demo_local",
          sentAt: new Date().toISOString(),
          metadata: { aiTriggered: true, actionUrl: args.actionUrl },
        });
        return {
          messageId: msg.messageId,
          toEmail: msg.toEmail,
          subject: msg.subject,
          status: "SENT",
          message: `Announcement email sent to ${args.toEmail}.`,
        };
      },
    });
  }
}

export const defaultAiToolRegistry = new AiToolRegistry();
