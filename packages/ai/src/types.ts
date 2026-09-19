/**
 * CampusOS AI Architecture - Types & Interfaces
 */

export type AiRole = "user" | "assistant" | "system";

export interface CampusAIMessage {
  role: AiRole;
  content: string;
  toolCalls?: AIToolCallProposal[];
  toolResults?: AIToolResult[];
}

export interface AIToolCallProposal {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  isMutating: boolean;
  requiresConfirmation: boolean;
}

export interface AIToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
  error?: string;
}

export interface AIResponse {
  reply: string;
  toolCalls?: AIToolCallProposal[];
  actionProposals?: AIToolCallProposal[];
  isDemoFallback: boolean;
  modelUsed: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ToolExecutionContext {
  userId: string;
  userRole?: string;
  userEmail?: string;
  db?: any; // DemoRepository or database handle
  skipConfirmation?: boolean;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  parametersSchema: any; // Zod schema
  genAiDeclaration: any; // FunctionDeclaration for @google/genai
  isMutating: boolean;
  requiresConfirmation: boolean;
  execute: (args: any, context: ToolExecutionContext) => Promise<any>;
}

export interface TokenRateSafeguardConfig {
  maxRequestsPerMinute: number;
  maxInputCharacters: number;
  maxToolCallsPerRequest: number;
  maxOutputTokens?: number;
}
