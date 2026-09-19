"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Flame,
} from "lucide-react";

export function DashboardView() {
  const { activePersona, setActiveTab } = useApp();
  const [quickCheckinSuccess, setQuickCheckinSuccess] = useState(false);

  const handleSimulateCheckin = () => {
    setQuickCheckinSuccess(true);
    setTimeout(() => setQuickCheckinSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-900/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
              {activePersona.role} PORTAL
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Academic Term 2026-II
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Welcome back, {activePersona.name}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            You have 2 classes today, 1 pending lab report due tomorrow, and CampusHack begins in 26 days.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("ai")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Campus AI</span>
          </button>
          <button
            onClick={handleSimulateCheckin}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
              quickCheckinSuccess
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--foreground)]"
            }`}
          >
            {quickCheckinSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Checked In!</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>Simulate GPS Check-in</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Overall Attendance</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)] mt-2">94.2%</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span>Eligible for final exams</span>
            <span>(Min 75%)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Upcoming Events</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)] mt-2">2 Active</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            CampusHack 2026 & RoboCamp
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Pending Tasks</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)] mt-2">2 Due</div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            Machine Learning Lab Report
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-medium">Club Memberships</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--foreground)] mt-2">3 Societies</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            ACM • Robotics • Design
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Timetable + Featured Hackathon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
              Today&apos;s Academic Schedule
            </h2>
            <button
              onClick={() => setActiveTab("timetable")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Full Timetable <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start justify-between p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-500/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex flex-col items-center justify-center font-mono text-xs font-semibold">
                  <span>10:00</span>
                  <span className="text-[9px] opacity-70">AM</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    CS601: Distributed Systems & Consensus
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Hall B-201 • Dr. Marcus Vance
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-medium">
                Attended
              </span>
            </div>

            <div className="flex items-start justify-between p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-500/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex flex-col items-center justify-center font-mono text-xs font-semibold">
                  <span>02:30</span>
                  <span className="text-[9px] opacity-70">PM</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    CS602: Artificial Intelligence & Edge Robotics
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Robotics Prototyping Bay • Sarah Jenkins
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-medium">
                Upcoming
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Featured Event */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[10px] font-semibold">
                FEATURED HACKATHON
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">ACM Chapter</span>
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">
              CampusHack 2026
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              36 hours of high-performance coding, Gemini 2.5 agent tool-chains, and hardware robotics.
            </p>

            <div className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>October 15 - 16, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Turing Innovation Hall & Labs</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("events")}
            className="w-full mt-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>Register & Get Pass</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
