import { demoDb } from "@campusos/db";
import type { AiActionRecord } from "@campusos/db";
import { AiToolRegistry, defaultAiToolRegistry } from "./tools";
import type { AIToolCallProposal, ToolExecutionContext } from "./types";
import { validateToolCallSafeguards } from "./safeguards";

/**
 * AiActionService
 * 
 * Manages action lifecycle, audit logging, user confirmations for mutating actions,
 * and executes approved application tools.
 */
export class AiActionService {
  private registry: AiToolRegistry;

  constructor(registry: AiToolRegistry = defaultAiToolRegistry) {
    this.registry = registry;
  }

  /**
   * Records a proposed action in the database and audit trail.
   * If mutating, requires explicit user confirmation (PENDING status).
   */
  async proposeAction(
    conversationId: string,
    toolCall: AIToolCallProposal,
    db: any = demoDb
  ): Promise<AiActionRecord> {
    const actionRecord = db.createAiAction({
      conversationId,
      toolName: toolCall.toolName,
      parameters: toolCall.parameters,
      isMutating: toolCall.isMutating,
      confirmationStatus: toolCall.requiresConfirmation ? "PENDING" : "APPROVED",
    });

    return actionRecord;
  }

  /**
   * Batch proposes multiple tool calls, enforcing maximum tool calls safeguard.
   */
  async proposeBatchActions(
    conversationId: string,
    toolCalls: AIToolCallProposal[],
    maxAllowed: number = 5,
    db: any = demoDb
  ): Promise<AiActionRecord[]> {
    validateToolCallSafeguards(toolCalls.length, maxAllowed);

    const records: AiActionRecord[] = [];
    for (const call of toolCalls) {
      const record = await this.proposeAction(conversationId, call, db);
      records.push(record);
    }
    return records;
  }

  /**
   * Executes an action. Mutating actions require confirmation.
   */
  async executeAction(
    actionId: string,
    context: ToolExecutionContext,
    confirmed: boolean = false,
    db: any = demoDb
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const action = db.getAiActionById(actionId);
    if (!action) {
      return { success: false, error: `Action ${actionId} not found.` };
    }

    if (action.confirmationStatus === "REJECTED") {
      return { success: false, error: `Action ${actionId} was rejected.` };
    }

    // Mutating actions must have explicit confirmation
    if (action.isMutating && !confirmed && !context.skipConfirmation) {
      return {
        success: false,
        error: `Action "${action.toolName}" is mutating and requires user confirmation. Pass confirmed=true.`,
      };
    }

    // Execute through approved tool registry
    const execResult = await this.registry.executeTool(
      action.toolName,
      action.parameters,
      { ...context, db }
    );

    const now = new Date().toISOString();
    if (execResult.success) {
      db.updateAiAction(actionId, {
        confirmationStatus: "APPROVED",
        executedAt: now,
        result: execResult.result,
      });

      db.logAudit({
        actorId: context.userId,
        action: "AI_ACTION_EXECUTED",
        resourceType: "ai_action",
        resourceId: actionId,
        changes: {
          toolName: action.toolName,
          status: "SUCCESS",
        },
      });

      return { success: true, result: execResult.result };
    } else {
      db.updateAiAction(actionId, {
        executedAt: now,
        result: { error: execResult.error },
      });

      db.logAudit({
        actorId: context.userId,
        action: "AI_ACTION_FAILED",
        resourceType: "ai_action",
        resourceId: actionId,
        changes: {
          toolName: action.toolName,
          error: execResult.error,
        },
      });

      return { success: false, error: execResult.error };
    }
  }

  /**
   * Approves and immediately executes a pending mutating action.
   */
  async approveAndExecute(
    actionId: string,
    context: ToolExecutionContext,
    db: any = demoDb
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    return this.executeAction(actionId, context, true, db);
  }

  /**
   * Rejects an action.
   */
  async rejectAction(
    actionId: string,
    context: ToolExecutionContext,
    db: any = demoDb
  ): Promise<{ success: boolean; message: string }> {
    const action = db.getAiActionById(actionId);
    if (!action) {
      return { success: false, message: `Action ${actionId} not found.` };
    }

    db.updateAiAction(actionId, {
      confirmationStatus: "REJECTED",
    });

    db.logAudit({
      actorId: context.userId,
      action: "AI_ACTION_REJECTED",
      resourceType: "ai_action",
      resourceId: actionId,
      changes: {
        toolName: action.toolName,
      },
    });

    return { success: true, message: `Action ${actionId} rejected.` };
  }

  getPendingActions(conversationId?: string, db: any = demoDb): AiActionRecord[] {
    return db.getAiActions(conversationId, "PENDING");
  }

  getActionById(id: string, db: any = demoDb): AiActionRecord | undefined {
    return db.getAiActionById(id);
  }
}

export const defaultAiActionService = new AiActionService();
