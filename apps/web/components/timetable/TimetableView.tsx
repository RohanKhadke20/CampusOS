"use client";

import React, { useState } from "react";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, Badge, Tabs } from "@campusos/ui";

export function TimetableView() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const [activeDay, setActiveDay] = useState("all");

  const schedule = [
    {
      time: "09:00 - 10:30 AM",
      subject: "CS601: Distributed Systems & Consensus",
      faculty: "Dr. Marcus Vance",
      room: "Turing Lab 301",
      days: ["Monday", "Wednesday", "Friday"],
      type: "Lecture",
    },
    {
      time: "11:00 - 12:30 PM",
      subject: "CS602: Artificial Intelligence & Edge Robotics",
      faculty: "Prof. Ananya Roy",
      room: "Robotics Arena",
      days: ["Tuesday", "Thursday"],
      type: "Lab",
    },
    {
      time: "02:00 - 03:30 PM",
      subject: "CS603: Cloud Architecture & Zero-Trust Security",
      faculty: "Dr. Ethan Wright",
      room: "Hall B-104",
      days: ["Monday", "Wednesday"],
      type: "Seminar",
    },
    {
      time: "04:00 - 05:30 PM",
      subject: "CS604: Open Source Engineering & GitOps",
      faculty: "Sarah Jenkins (TA)",
      room: "Makerspace Hub",
      days: ["Thursday", "Friday"],
      type: "Studio",
    },
  ];

  const filterTabs = [
    { id: "all", label: "Full Week" },
    ...days.map((d) => ({ id: d, label: d.slice(0, 3) })),
  ];

  const displayedDays = activeDay === "all" ? days : [activeDay];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Academic Timetable & Schedule
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Weekly classroom schedule, laboratory sessions, and professor office hours.
          </p>
        </div>

        <Tabs
          items={filterTabs}
          activeId={activeDay}
          onChange={setActiveDay}
          size="sm"
        />
      </div>

      <div
        className={`grid gap-4 ${
          displayedDays.length === 1
            ? "grid-cols-1 max-w-xl"
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        }`}
      >
        {displayedDays.map((day) => (
          <Card key={day} variant="default" className="flex flex-col justify-start">
            <CardHeader className="py-3 px-4 bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--brand-indigo)]">
                  {day}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {schedule.filter((s) => s.days.includes(day)).length} sessions
                </span>
              </div>
            </CardHeader>

            <div className="p-3 space-y-2.5 flex-1">
              {schedule
                .filter((s) => s.days.includes(day))
                .map((slot, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-xs space-y-1.5 hover:border-[var(--border-interactive)] transition-all duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--brand-indigo)] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slot.time}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {slot.type}
                      </Badge>
                    </div>
                    <div className="font-semibold text-[var(--text-primary)] text-xs leading-snug">
                      {slot.subject}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]/60">
                      <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                      <span>{slot.room}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span>{slot.faculty}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
