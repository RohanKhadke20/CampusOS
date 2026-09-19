import { z } from "zod";

// Capability 1: Summarize Event
export const EventSummarySchema = z.object({
  title: z.string().min(1),
  oneLineSummary: z.string().min(1),
  overview: z.string().min(1),
  keyHighlights: z.array(z.string()).min(1),
  targetAudience: z.string(),
  prerequisites: z.array(z.string()).default([]),
  schedule: z.object({
    date: z.string(),
    timeRange: z.string(),
    venue: z.string(),
  }),
});
export type EventSummary = z.infer<typeof EventSummarySchema>;

// Capability 2: Generate Event Description
export const EventDescriptionSchema = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  fullDescription: z.string().min(10),
  keyHighlights: z.array(z.string()).min(1),
  whoShouldAttend: z.array(z.string()).min(1),
  agenda: z.array(
    z.object({
      time: z.string(),
      activity: z.string(),
    })
  ).default([]),
  callToAction: z.string().min(1),
});
export type EventDescription = z.infer<typeof EventDescriptionSchema>;

// Capability 3: Create Study Plan
export const StudyPlanSchema = z.object({
  title: z.string().min(1),
  targetGoal: z.string().min(1),
  totalWeeks: z.number().int().positive(),
  weeklyHoursRecommended: z.number().positive(),
  phases: z.array(
    z.object({
      phaseNumber: z.number().int().positive(),
      name: z.string().min(1),
      focusTopics: z.array(z.string()).min(1),
      milestones: z.array(z.string()).min(1),
      weeklyPlan: z.array(
        z.object({
          week: z.number().int().positive(),
          tasks: z.array(z.string()).min(1),
          deliverables: z.array(z.string()).default([]),
        })
      ),
    })
  ).min(1),
  studyTips: z.array(z.string()).default([]),
});
export type StudyPlan = z.infer<typeof StudyPlanSchema>;

// Capability 4: Summarize Tasks
export const TaskSummarySchema = z.object({
  totalTasks: z.number().int().nonnegative(),
  summary: z.string().min(1),
  priorityBreakdown: z.object({
    urgent: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
  }),
  overdueCount: z.number().int().nonnegative(),
  overdueTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dueDate: z.string(),
    })
  ).default([]),
  upcomingTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      priority: z.string(),
      dueDate: z.string().optional().nullable(),
    })
  ).default([]),
  recommendedNextAction: z.string().min(1),
});
export type TaskSummary = z.infer<typeof TaskSummarySchema>;

// Capability 5: Natural Language Schedule Lookup
export const ScheduleLookupSchema = z.object({
  query: z.string().min(1),
  matchedDate: z.string(),
  items: z.array(
    z.object({
      time: z.string(),
      title: z.string(),
      location: z.string().optional().nullable(),
      type: z.enum(["lecture", "event", "exam", "task", "free_slot"]),
      isConflict: z.boolean().default(false),
    })
  ),
  freeSlots: z.array(
    z.object({
      start: z.string(),
      end: z.string(),
      durationMinutes: z.number().positive(),
    })
  ).default([]),
  summary: z.string().min(1),
});
export type ScheduleLookup = z.infer<typeof ScheduleLookupSchema>;

// Capability 6: Campus Event Search
export const EventSearchResultSchema = z.object({
  query: z.string().min(1),
  totalMatches: z.number().int().nonnegative(),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      category: z.string(),
      venue: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      isPaid: z.boolean(),
      organizationName: z.string().optional().nullable(),
      relevanceExplanation: z.string(),
    })
  ),
  summary: z.string().min(1),
});
export type EventSearchResult = z.infer<typeof EventSearchResultSchema>;

// Capability 7: Generate Announcement
export const AnnouncementSchema = z.object({
  headline: z.string().min(1),
  targetAudience: z.enum(["ALL", "STUDENTS", "ORGANIZERS", "FACULTY"]),
  urgency: z.enum(["NORMAL", "HIGH", "URGENT"]),
  body: z.string().min(10),
  actionLabel: z.string().optional().nullable(),
  actionUrl: z.string().optional().nullable(),
  publishChannels: z.array(z.enum(["EMAIL", "DASHBOARD", "NOTIFICATION"])).min(1),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

// Capability 8: Tool Calling
export const ToolCallingProposalSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  parameters: z.record(z.any()),
  isMutating: z.boolean(),
  requiresConfirmation: z.boolean(),
});
export type ToolCallingProposal = z.infer<typeof ToolCallingProposalSchema>;
