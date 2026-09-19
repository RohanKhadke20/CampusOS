import { NextRequest, NextResponse } from "next/server";
import { processAICampusQuery } from "@campusos/ai";
import { getCurrentUser } from "@/lib/auth/authorization";
import { z } from "zod";

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Server-side session & authorization check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Active CampusOS session required to query Campus AI" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, history } = parsed.data;
    const aiResult = await processAICampusQuery(message, history);

    return NextResponse.json(aiResult, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal AI processing error", message: error.message },
      { status: 500 }
    );
  }
}
