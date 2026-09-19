import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/events/service";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const events = await EventService.listEvents({}, user.id);
    const registrations = await EventService.getGlobalRegistrations(user);
    const analytics = await EventService.getGlobalAnalytics(user);

    return NextResponse.json({
      success: true,
      data: {
        events,
        registrations,
        analytics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin events data" },
      { status: 500 }
    );
  }
}
