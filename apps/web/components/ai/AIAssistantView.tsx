"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, Input } from "@campusos/ui";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolProposal?: {
    id: string;
    toolName: string;
    parameters: any;
  };
}

export function AIAssistantView() {
  const { activePersona } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      role: "assistant",
      content:
        "Hello! I am your CampusOS Autonomous Assistant. You can ask me about academic timetable schedules, campus hackathons, lab availability, or have me draft events. How can I help today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmedActions, setConfirmedActions] = useState<string[]>([]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        toolProposal: data.toolCalls?.[0],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, an unexpected error occurred while communicating with the AI service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTool = (toolId: string) => {
    setConfirmedActions((prev) => [...prev, toolId]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
      {/* AI Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-raised)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span>CampusOS AI Agent</span>
              <Badge variant="brand" size="sm">
                Gemini 2.5 Demo
              </Badge>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Equipped with Model Context Protocol (MCP) toolchain
            </div>
          </div>
        </div>

        <Badge variant="success" size="sm" withDot>
          Agent Online
        </Badge>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-2xl px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--brand-indigo)] text-white rounded-br-none"
                  : "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-none"
              }`}
            >
              {m.content}
            </div>

            {/* Human-In-The-Loop Tool Confirmation Card */}
            {m.toolProposal && (
              <Card variant="highlight" className="mt-3 max-w-md p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-[var(--brand-indigo)] text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Proposed Action (Requires Human Confirmation)</span>
                </div>

                <div className="p-2 rounded bg-[var(--canvas)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                  <div>Tool: {m.toolProposal.toolName}</div>
                  <div>Payload: {JSON.stringify(m.toolProposal.parameters)}</div>
                </div>

                {confirmedActions.includes(m.toolProposal.id) ? (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--status-success)] font-medium py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Action executed and logged in Google Calendar</span>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleConfirmTool(m.toolProposal!.id)}
                    >
                      Approve & Execute
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {}}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-[var(--text-muted)] italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-indigo)] animate-ping"></span>
            Thinking and querying campus index...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)] flex items-center gap-2"
      >
        <div className="flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask e.g. 'What hackathons are coming up?' or 'When is my next class?'"
          />
        </div>
        <Button
          type="submit"
          size="md"
          variant="primary"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
