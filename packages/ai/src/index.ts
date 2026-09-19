// AI Service Abstraction Layer (Phase 2 skeleton)

export interface CampusAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIToolCallProposal {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  isMutating: boolean;
  userConfirmationRequired: boolean;
}

export interface AIResponse {
  reply: string;
  toolCalls?: AIToolCallProposal[];
  isDemoFallback: boolean;
}

export async function processAICampusQuery(
  prompt: string,
  history: CampusAIMessage[] = []
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Deterministic Demo AI Fallback
    const lower = prompt.toLowerCase();
    if (lower.includes("event") || lower.includes("hackathon")) {
      return {
        reply: "Here is what I found on CampusOS: The flagship **CampusHack 2026: AI & Edge Systems** is scheduled for Oct 15-16 at Turing Innovation Hall. Would you like me to register you or add it to your Google Calendar?",
        toolCalls: [
          {
            id: `call-${Date.now()}`,
            toolName: "create_calendar_event",
            parameters: {
              title: "CampusHack 2026",
              startTime: "2026-10-15T09:00:00Z",
              endTime: "2026-10-16T21:00:00Z",
              location: "Turing Innovation Hall & Labs",
            },
            isMutating: true,
            userConfirmationRequired: true,
          },
        ],
        isDemoFallback: true,
      };
    }

    return {
      reply: "CampusOS AI Assistant is running in Demo Mode. I can help answer questions about upcoming hackathons, campus clubs, timetable schedules, and lab availability.",
      isDemoFallback: true,
    };
  }

  // Live Gemini invocation will be implemented in Phase 7
  return {
    reply: "Gemini API integration configured.",
    isDemoFallback: false,
  };
}
