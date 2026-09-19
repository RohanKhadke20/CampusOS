"use client";

import React from "react";
import { Clock, MapPin, User, Calendar } from "lucide-react";

export function TimetableView() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const schedule = [
    {
      time: "09:00 - 10:30 AM",
      subject: "CS601: Distributed Systems & Consensus",
      faculty: "Dr. Marcus Vance",
      room: "Turing Lab 301",
      days: ["Monday", "Wednesday", "Friday"],
    },
    {
      time: "11:00 - 12:30 PM",
      subject: "CS602: Artificial Intelligence & Edge Robotics",
      faculty: "Prof. Ananya Roy",
      room: "Robotics Arena",
      days: ["Tuesday", "Thursday"],
    },
    {
      time: "02:00 - 03:30 PM",
      subject: "CS603: Cloud Architecture & Zero-Trust Security",
      faculty: "Dr. Ethan Wright",
      room: "Hall B-104",
      days: ["Monday", "Wednesday"],
    },
    {
      time: "04:00 - 05:30 PM",
      subject: "CS604: Open Source Engineering & GitOps",
      faculty: "Sarah Jenkins (TA)",
      room: "Makerspace Hub",
      days: ["Thursday", "Friday"],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Academic Timetable & Schedule
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Weekly classroom schedule, laboratory sessions, and professor office hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map((day) => (
          <div
            key={day}
            className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3"
          >
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 pb-2 border-b border-[var(--border)]">
              {day}
            </div>

            <div className="space-y-2.5">
              {schedule
                .filter((s) => s.days.includes(day))
                .map((slot, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs space-y-1 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="text-[10px] font-mono text-indigo-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.time}
                    </div>
                    <div className="font-semibold text-[var(--foreground)] leading-snug">
                      {slot.subject}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-[var(--brand-accent)]" />
                      {slot.room}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {slot.faculty}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
