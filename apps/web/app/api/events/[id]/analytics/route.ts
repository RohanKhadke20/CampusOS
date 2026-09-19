import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/events/service";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await EventService.getEventAnalytics(eventId, user);
    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load event analytics" },
      { status: isForbidden ? 403 : 400 }
    );
  }
}
