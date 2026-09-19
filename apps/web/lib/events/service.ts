import { demoDb } from "@campusos/db";
import type { AuthUser, UserRole } from "../auth/types";
import { EventStatusSchema, type EventStatus } from "@campusos/core";
import { z } from "zod";

export const CreateEventInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3).optional(),
  organizationId: z.string().optional().nullable(),
  description: z.string().optional(),
  venue: z.string().min(2, "Venue is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  maxCapacity: z.number().int().positive().default(100).optional(),
  isPaid: z.boolean().default(false).optional(),
  bannerUrl: z.string().optional().nullable(),
  status: EventStatusSchema.default("DRAFT").optional(),
  tickets: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(2),
      description: z.string().optional(),
      priceCents: z.number().int().nonnegative().default(0),
      currency: z.string().default("INR"),
      quantityAvailable: z.number().int().positive().default(100),
    })
  ).optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export class EventService {
  /**
   * Browse & search events with filters
   */
  static async listEvents(
    filters?: {
      query?: string;
      category?: string;
      status?: string;
      isPaid?: boolean;
      organizationId?: string;
    },
    currentUserId?: string
  ) {
    return demoDb.getEvents({
      ...filters,
      userId: currentUserId,
    });
  }

  /**
   * Get single event by slug or UUID
   */
  static async getEvent(idOrSlug: string, currentUserId?: string) {
    let event = demoDb.getEventBySlug(idOrSlug, currentUserId);
    if (!event) {
      event = demoDb.getEventById(idOrSlug, currentUserId);
    }
    return event;
  }

  /**
   * Organizer / Admin: Create new event
   */
  static async createEvent(input: CreateEventInput, actor: AuthUser) {
    if (actor.role !== "ORGANIZER" && actor.role !== "ADMIN") {
      throw new Error("Forbidden: Only organizers and administrators can create events.");
    }

    const validated = CreateEventInputSchema.parse(input);

    return demoDb.createEvent({
      ...validated,
      createdBy: actor.id,
    });
  }

  /**
   * Organizer / Admin: Update event details
   */
  static async updateEvent(id: string, updates: Partial<CreateEventInput>, actor: AuthUser) {
    const existing = demoDb.getEventById(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    if (actor.role !== "ADMIN" && existing.createdBy !== actor.id && actor.role !== "ORGANIZER") {
      throw new Error("Forbidden: You do not have permission to edit this event.");
    }

    return demoDb.updateEvent(id, updates, actor.id);
  }

  /**
   * Organizer / Admin: Publish / unpublish / complete / cancel event
   */
  static async setStatus(id: string, status: EventStatus, actor: AuthUser) {
    const existing = demoDb.getEventById(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    if (actor.role !== "ADMIN" && existing.createdBy !== actor.id && actor.role !== "ORGANIZER") {
      throw new Error("Forbidden: You do not have permission to modify event status.");
    }

    return demoDb.setEventStatus(id, status, actor.id);
  }

  /**
   * Admin / Organizer: Deactivate event
   */
  static async deleteEvent(id: string, actor: AuthUser) {
    const existing = demoDb.getEventById(id);
    if (!existing) {
      throw new Error("Event not found");
    }

    if (actor.role !== "ADMIN" && existing.createdBy !== actor.id) {
      throw new Error("Forbidden: Only event organizers or administrators can deactivate an event.");
    }

    return demoDb.deleteEvent(id, actor.id);
  }

  /**
   * Student: Register for an event
   */
  static async register(eventId: string, ticketId: string, actor: AuthUser) {
    const event = demoDb.getEventById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status !== "PUBLISHED" && actor.role === "STUDENT") {
      throw new Error("This event is not published for student registration.");
    }

    return demoDb.registerForEvent({
      eventId,
      ticketId,
      userId: actor.id,
      userEmail: actor.email,
    });
  }

  /**
   * Organizer / Admin: Get participant list for an event
   */
  static async getParticipants(eventId: string, actor: AuthUser) {
    const event = demoDb.getEventById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (actor.role !== "ADMIN" && actor.role !== "ORGANIZER") {
      throw new Error("Forbidden: Only organizers or administrators can view participant rosters.");
    }

    return demoDb.getRegistrations({ eventId });
  }

  /**
   * Organizer / Admin: Check in a registered participant
   */
  static async checkInParticipant(registrationId: string, actor: AuthUser) {
    if (actor.role !== "ADMIN" && actor.role !== "ORGANIZER") {
      throw new Error("Forbidden: Only organizers or administrators can check in participants.");
    }

    return demoDb.checkInParticipant(registrationId);
  }

  /**
   * Organizer / Admin: Get analytics for a specific event
   */
  static async getEventAnalytics(eventId: string, actor: AuthUser) {
    if (actor.role !== "ADMIN" && actor.role !== "ORGANIZER") {
      throw new Error("Forbidden: Analytics are restricted to organizers and administrators.");
    }

    return demoDb.getEventAnalytics(eventId);
  }

  /**
   * Admin: Global events analytics & moderation inspection
   */
  static async getGlobalAnalytics(actor: AuthUser) {
    if (actor.role !== "ADMIN") {
      throw new Error("Forbidden: Global analytics requires administrator privileges.");
    }

    return demoDb.getGlobalEventsAnalytics();
  }

  /**
   * Admin: Global list of registrations with payment inspection
   */
  static async getGlobalRegistrations(actor: AuthUser) {
    if (actor.role !== "ADMIN") {
      throw new Error("Forbidden: Admin privileges required.");
    }

    return demoDb.getRegistrations();
  }
}
