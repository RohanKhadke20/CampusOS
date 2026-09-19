import { NextRequest, NextResponse } from "next/server";
import { EventService } from "@/lib/events/service";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const registrationId = body.registrationId;
    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "registrationId is required" },
        { status: 400 }
      );
    }

    const updated = await EventService.checkInParticipant(registrationId, user);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const isForbidden = error.message?.includes("Forbidden");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check in" },
      { status: isForbidden ? 403 : 400 }
    );
  }
}
