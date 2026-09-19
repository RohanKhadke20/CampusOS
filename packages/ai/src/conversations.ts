import { demoDb } from "@campusos/db";
import type { AiConversationRecord, AiMessageRecord } from "@campusos/db";
import { AiProvider, getAiProvider } from "./provider";
import { AiToolRegistry, defaultAiToolRegistry } from "./tools";
import { AiActionService, defaultAiActionService } from "./actions";
import type { CampusAIMessage, AIToolCallProposal, ToolExecutionContext } from "./types";
import { sanitizePrompt } from "./security";
import { globalAiRateLimiter, validateInputSafeguards, validateToolCallSafeguards } from "./safeguards";

export interface SendMessageOptions {
  conversationId: string;
  userId: string;
  userMessage: string;
  userRole?: string;
  userEmail?: string;
  skipConfirmation?: boolean;
  maxToolCalls?: number;
  db?: any;
}

export interface ConversationStepResult {
  reply: string;
  toolCallsExecuted: Array<{ toolName: string; result: any }>;
  actionProposals: AIToolCallProposal[];
  isDemoFallback: boolean;
  conversationId: string;
}

/**
 * AiConversationService
 * 
 * Coordinates multi-turn AI interactions, conversation persistence,
 * tool execution loop, and action proposal lifecycle.
 */
export class AiConversationService {
  private provider: AiProvider;
  private tools: AiToolRegistry;
  private actions: AiActionService;

  constructor(
    provider: AiProvider = getAiProvider(),
    tools: AiToolRegistry = defaultAiToolRegistry,
    actions: AiActionService = defaultAiActionService
  ) {
    this.provider = provider;
    this.tools = tools;
    this.actions = actions;
  }

  createConversation(userId: string, title?: string, db: any = demoDb): AiConversationRecord {
    return db.createAiConversation(userId, title);
  }

  getConversation(conversationId: string, db: any = demoDb): AiConversationRecord | undefined {
    return db.getAiConversationById(conversationId);
  }

  listConversations(userId: string, db: any = demoDb): AiConversationRecord[] {
    return db.getAiConversations(userId);
  }

  deleteConversation(conversationId: string, db: any = demoDb): boolean {
    return db.deleteAiConversation(conversationId);
  }

  getMessages(conversationId: string, db: any = demoDb): AiMessageRecord[] {
    return db.getAiMessages(conversationId);
  }

  async sendMessage(options: SendMessageOptions): Promise<ConversationStepResult> {
    const {
      conversationId,
      userId,
      userMessage,
      userRole = "STUDENT",
      userEmail,
      skipConfirmation = false,
      maxToolCalls = 5,
      db = demoDb,
    } = options;

    // 1. Rate limiter check
    globalAiRateLimiter.assertAllowed(userId);

    // 2. Input length safeguard check
    validateInputSafeguards(userMessage);

    // 3. Ensure conversation exists
    let conversation = db.getAiConversationById(conversationId);
    if (!conversation) {
      conversation = db.createAiConversation(userId, userMessage.slice(0, 40));
    }

    // 4. Save user message to database
    db.createAiMessage({
      conversationId,
      role: "user",
      content: sanitizePrompt(userMessage),
    });

    // 5. Fetch previous conversation history
    const storedMessages = db.getAiMessages(conversationId);
    const chatHistory: CampusAIMessage[] = storedMessages.map((m: any) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // 6. Tool execution context (safe application context, never passes raw credentials)
    const context: ToolExecutionContext = {
      userId,
      userRole,
      userEmail,
      db,
      skipConfirmation,
    };

    // 7. Invoke model with approved tools
    const availableTools = this.tools.getAllTools();
    const chatResponse = await this.provider.chat(chatHistory, availableTools, {
      userId,
      maxToolCalls,
    });

    const proposedCalls = chatResponse.toolCalls || [];
    validateToolCallSafeguards(proposedCalls.length, maxToolCalls);

    const toolCallsExecuted: Array<{ toolName: string; result: any }> = [];
    const actionProposals: AIToolCallProposal[] = [];

    // 8. Handle tool calls through approved application tools
    for (const call of proposedCalls) {
      const toolDef = this.tools.getTool(call.toolName);
      if (!toolDef) continue;

      if (toolDef.isMutating && toolDef.requiresConfirmation && !skipConfirmation) {
        // Mutating actions require explicit confirmation -> record in ai_actions as PENDING
        await this.actions.proposeAction(conversationId, call, db);
        actionProposals.push(call);
      } else {
        // Read-only or pre-confirmed tool calls execute immediately
        const exec = await this.tools.executeTool(call.toolName, call.parameters, context);
        toolCallsExecuted.push({ toolName: call.toolName, result: exec.result });
      }
    }

    // 9. Persist assistant response to database
    db.createAiMessage({
      conversationId,
      role: "assistant",
      content: chatResponse.reply,
      toolCalls: proposedCalls.length > 0 ? proposedCalls : undefined,
      toolResults: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
    });

    // 10. Audit log for conversation interaction
    db.logAudit({
      actorId: userId,
      action: "AI_CONVERSATION_MESSAGE",
      resourceType: "ai_conversation",
      resourceId: conversationId,
      changes: {
        toolCallsProposed: proposedCalls.length,
        actionsRequiringConfirmation: actionProposals.length,
      },
    });

    return {
      reply: chatResponse.reply,
      toolCallsExecuted,
      actionProposals,
      isDemoFallback: chatResponse.isDemoFallback,
      conversationId,
    };
  }
}

export const defaultAiConversationService = new AiConversationService();
