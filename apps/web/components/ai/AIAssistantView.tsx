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
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
      {/* AI Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-raised)]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
              <span>CampusOS AI Agent</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400">
                Gemini 2.5 Demo
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Equipped with Model Context Protocol (MCP) toolchain
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </div>
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
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-none"
              }`}
            >
              {m.content}
            </div>

            {/* Human-In-The-Loop Tool Confirmation Card */}
            {m.toolProposal && (
              <div className="mt-3 p-3.5 rounded-xl bg-[var(--surface-raised)] border border-indigo-500/30 max-w-md space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Proposed Action (Requires Human Confirmation)</span>
                </div>
                <div className="p-2 rounded bg-[var(--background)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
                  <div>Tool: {m.toolProposal.toolName}</div>
                  <div>Payload: {JSON.stringify(m.toolProposal.parameters)}</div>
                </div>

                {confirmedActions.includes(m.toolProposal.id) ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Action executed and logged in Google Calendar</span>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleConfirmTool(m.toolProposal!.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                    >
                      Approve & Execute
                    </button>
                    <button
                      onClick={() => {}}
                      className="px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-muted)]"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-[var(--text-muted)] italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            Thinking and querying campus index...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask e.g. 'What hackathons are coming up?' or 'When is my next class?'"
          className="flex-1 px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
