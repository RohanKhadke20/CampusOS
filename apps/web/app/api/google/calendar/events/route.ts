import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import {
  decryptRefreshToken,
  createAuthenticatedGoogleCalendarClient,
  listUpcomingCalendarEvents,
  createGoogleCalendarEvent,
  addCampusEventToGoogleCalendar,
} from "@campusos/integrations";

/**
 * Helper to resolve authenticated Google Calendar client for the current user.
 * Throws structured error if disconnected or invalid.
 */
async function resolveCalendarClient(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "unauthorized", message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const connection = demoDb.getGoogleConnection(user.id);
  if (!connection) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "disconnected",
          message: "Google account is not connected. Please authorize Google Calendar.",
        },
        { status: 404 }
      ),
    };
  }

  try {
    const decryptedToken = decryptRefreshToken(connection.encryptedRefreshToken);
    const client = createAuthenticatedGoogleCalendarClient(decryptedToken);
    return { user, connection, client };
  } catch (err: any) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "revoked_consent",
          message: "Google Calendar authorization could not be decrypted. Please reconnect your account.",
        },
        { status: 403 }
      ),
    };
  }
}

/**
 * GET /api/google/calendar/events
 * Shows upcoming calendar events
 */
export async function GET(request: NextRequest) {
  const resolved = await resolveCalendarClient(request);
  if ("errorResponse" in resolved && resolved.errorResponse) {
    return resolved.errorResponse;
  }

  const { client } = resolved;
  const { searchParams } = new URL(request.url);
  const maxResults = searchParams.get("maxResults")
    ? parseInt(searchParams.get("maxResults")!, 10)
    : 20;
  const timeMin = searchParams.get("timeMin") || new Date().toISOString();

  try {
    const events = await listUpcomingCalendarEvents(client, { maxResults, timeMin });
    return NextResponse.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.error || "unknown_error",
        message: err.message || "Failed to fetch Google Calendar events.",
      },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/google/calendar/events
 * Creates a new event or adds an existing CampusOS event to Google Calendar
 */
export async function POST(request: NextRequest) {
  const resolved = await resolveCalendarClient(request);
  if ("errorResponse" in resolved && resolved.errorResponse) {
    return resolved.errorResponse;
  }

  const { user, client } = resolved;

  try {
    const body = await request.json();
    const { campusEventId, eventId, title, description, location, startTime, endTime } = body;

    // Flow 1: Add existing CampusOS Event to Google Calendar
    const targetEventId = campusEventId || eventId;
    if (targetEventId && !title) {
      const campusEvent = demoDb.getEventById(targetEventId);
      if (!campusEvent) {
        return NextResponse.json(
          { success: false, error: "not_found", message: "Campus event not found." },
          { status: 404 }
        );
      }

      const createdItem = await addCampusEventToGoogleCalendar(client, {
        title: campusEvent.title,
        description: campusEvent.description,
        venue: campusEvent.venue,
        startTime: campusEvent.startTime,
        endTime: campusEvent.endTime,
        slug: campusEvent.slug,
      });

      // Mirror to database calendar_events
      demoDb.createCalendarEvent({
        userId: user.id,
        googleEventId: createdItem.id,
        eventId: campusEvent.id,
        title: createdItem.title,
        description: createdItem.description,
        location: createdItem.location,
        startTime: createdItem.startTime,
        endTime: createdItem.endTime,
        isSynced: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Campus event added to Google Calendar.",
          data: createdItem,
        },
        { status: 201 }
      );
    }

    // Flow 2: Create new Google Calendar Event
    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "bad_request",
          message: "Event title, startTime, and endTime are required.",
        },
        { status: 400 }
      );
    }

    const createdItem = await createGoogleCalendarEvent(client, {
      title,
      description,
      location,
      startTime,
      endTime,
    });

    demoDb.createCalendarEvent({
      userId: user.id,
      googleEventId: createdItem.id,
      eventId: targetEventId,
      title: createdItem.title,
      description: createdItem.description,
      location: createdItem.location,
      startTime: createdItem.startTime,
      endTime: createdItem.endTime,
      isSynced: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event successfully created in Google Calendar.",
        data: createdItem,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.error || "unknown_error",
        message: err.message || "Failed to create Google Calendar event.",
      },
      { status: err.statusCode || 500 }
    );
  }
}
