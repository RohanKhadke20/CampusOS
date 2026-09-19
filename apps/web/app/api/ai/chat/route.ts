import { NextRequest, NextResponse } from "next/server";
import {
  defaultAiConversationService,
  defaultAiActionService,
  RateLimitExceededError,
  TokenLimitExceededError,
  ToolCallLimitExceededError,
} from "@campusos/ai";
import { getCurrentUser } from "@/lib/auth/authorization";
import { z } from "zod";

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").optional(),
  conversationId: z.string().optional(),
  // Action approval flow
  actionId: z.string().optional(),
  actionConfirmation: z.enum(["APPROVE", "REJECT"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Server-side session & authorization check
    const user = await getCurrentUser(req);
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

    const { message, conversationId, actionId, actionConfirmation } = parsed.data;

    // Handle Action Confirmation flow if actionId is provided
    if (actionId) {
      const context = {
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
      };

      if (actionConfirmation === "APPROVE") {
        const result = await defaultAiActionService.approveAndExecute(actionId, context);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      } else {
        const result = await defaultAiActionService.rejectAction(actionId, context);
        return NextResponse.json(result, { status: 200 });
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: "Either 'message' or 'actionId' must be provided." },
        { status: 400 }
      );
    }

    // Process chat conversation
    const activeConvId = conversationId || `conv_${Date.now()}`;
    const result = await defaultAiConversationService.sendMessage({
      conversationId: activeConvId,
      userId: user.id,
      userMessage: message,
      userRole: user.role,
      userEmail: user.email,
    });

    return NextResponse.json({
      reply: result.reply,
      toolCalls: result.actionProposals,
      actionProposals: result.actionProposals,
      toolCallsExecuted: result.toolCallsExecuted,
      conversationId: result.conversationId,
      isDemoFallback: result.isDemoFallback,
    }, { status: 200 });
  } catch (error: any) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: "Rate limit exceeded", message: error.message },
        { status: 429 }
      );
    }

    if (error instanceof TokenLimitExceededError || error instanceof ToolCallLimitExceededError) {
      return NextResponse.json(
        { error: "Safeguard violation", message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal AI processing error", message: error.message },
      { status: 500 }
    );
  }
}
