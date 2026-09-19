/**
 * @campusos/ai - CampusOS AI Architecture
 * Powered by the official Google GenAI JavaScript SDK (@google/genai)
 */

export * from "./types";
export * from "./schemas";
export * from "./security";
export * from "./safeguards";
export * from "./provider";
export * from "./tools";
export * from "./actions";
export * from "./conversations";
export * from "./capabilities";

import { getAiProvider } from "./provider";
import { defaultAiToolRegistry } from "./tools";
import { defaultAiActionService } from "./actions";
import { defaultAiConversationService } from "./conversations";
import type { CampusAIMessage, AIResponse } from "./types";

/**
 * High-level convenience entry point: process a campus AI query
 */
export async function processAICampusQuery(
  prompt: string,
  history: CampusAIMessage[] = [],
  options?: {
    userId?: string;
    conversationId?: string;
    skipConfirmation?: boolean;
    maxToolCalls?: number;
  }
): Promise<AIResponse> {
  const userId = options?.userId || "a1111111-1111-4111-8111-111111111111"; // default student test ID
  const conversationId = options?.conversationId || `conv_temp_${Date.now()}`;

  const result = await defaultAiConversationService.sendMessage({
    conversationId,
    userId,
    userMessage: prompt,
    skipConfirmation: options?.skipConfirmation,
    maxToolCalls: options?.maxToolCalls,
  });

  return {
    reply: result.reply,
    toolCalls: result.actionProposals,
    actionProposals: result.actionProposals,
    isDemoFallback: result.isDemoFallback,
    modelUsed: result.isDemoFallback ? "campusos-demo-sandbox" : "gemini-2.5-flash",
  };
}
