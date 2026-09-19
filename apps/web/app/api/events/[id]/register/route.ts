import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/events/service";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in to register for this event." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const ticketId = body.ticketId;
    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "Please select a ticket tier." },
        { status: 400 }
      );
    }

    const registration = await EventService.register(eventId, ticketId, user);
    return NextResponse.json({ success: true, data: registration }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("already registered") ? 409 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status }
    );
  }
}
