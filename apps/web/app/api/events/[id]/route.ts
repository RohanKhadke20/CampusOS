import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/events/service";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const event = await EventService.getEvent(id, user?.id);

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // If body contains status only, use setStatus
    if (body.status && Object.keys(body).length === 1) {
      const updated = await EventService.setStatus(id, body.status, user);
      return NextResponse.json({ success: true, data: updated });
    }

    const updated = await EventService.updateEvent(id, body, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden");
    const isNotFound = error.message?.includes("not found");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update event" },
      { status: isForbidden ? 403 : isNotFound ? 404 : 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await EventService.deleteEvent(id, user);
    return NextResponse.json({ success: true, message: "Event deactivated successfully" });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to deactivate event" },
      { status: isForbidden ? 403 : 400 }
    );
  }
}
