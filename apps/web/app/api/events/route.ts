import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/events/service";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const isPaidParam = searchParams.get("isPaid");
    const organizationId = searchParams.get("organizationId") || undefined;

    const isPaid = isPaidParam === null || isPaidParam === undefined || isPaidParam === ""
      ? undefined
      : isPaidParam === "true";

    const events = await EventService.listEvents(
      { query, category, status, isPaid, organizationId },
      user?.id
    );

    return NextResponse.json({ success: true, count: events.length, data: events });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Organizers or Admins only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const event = await EventService.createEvent(body, user);

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create event" },
      { status: 400 }
    );
  }
}
