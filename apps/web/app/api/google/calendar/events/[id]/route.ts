import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import {
  decryptRefreshToken,
  createAuthenticatedGoogleCalendarClient,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@campusos/integrations";

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
 * PATCH /api/google/calendar/events/:id
 * Updates an event in Google Calendar and syncs local mirror
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await resolveCalendarClient(request);
  if ("errorResponse" in resolved && resolved.errorResponse) {
    return resolved.errorResponse;
  }

  const { user, client } = resolved;
  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const { title, description, location, startTime, endTime } = body;

    const updatedItem = await updateGoogleCalendarEvent(client, eventId, {
      title,
      description,
      location,
      startTime,
      endTime,
    });

    // Update local mirror if exists
    const localEvent = demoDb.getCalendarEventByGoogleId(user.id, eventId);
    if (localEvent) {
      demoDb.updateCalendarEvent(localEvent.id, {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        isSynced: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Calendar event successfully updated.",
      data: updatedItem,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.error || "unknown_error",
        message: err.message || "Failed to update Google Calendar event.",
      },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * DELETE /api/google/calendar/events/:id
 * Deletes an event from Google Calendar and unlinks local mirror
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await resolveCalendarClient(request);
  if ("errorResponse" in resolved && resolved.errorResponse) {
    return resolved.errorResponse;
  }

  const { user, client } = resolved;
  const { id: eventId } = await params;

  try {
    await deleteGoogleCalendarEvent(client, eventId);

    // Delete local mirror if exists
    const localEvent = demoDb.getCalendarEventByGoogleId(user.id, eventId);
    if (localEvent) {
      demoDb.deleteCalendarEvent(localEvent.id);
    }

    return NextResponse.json({
      success: true,
      message: "Calendar event successfully deleted from Google Calendar.",
      eventId,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.error || "unknown_error",
        message: err.message || "Failed to delete Google Calendar event.",
      },
      { status: err.statusCode || 500 }
    );
  }
}
