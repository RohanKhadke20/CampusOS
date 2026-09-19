"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";

export function StitchStudentDashboard() {
  const { activePersona, setActiveTab } = useApp();
  const [bleCheckedIn, setBleCheckedIn] = useState(false);
  const [bleLoading, setBleLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [syncingLms, setSyncingLms] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleBleCheckin = () => {
    setBleLoading(true);
    setTimeout(() => {
      setBleLoading(false);
      setBleCheckedIn(true);
      demoDb.recordAttendance({
        userId: activePersona.id,
        subjectCode: "CS 341",
        subjectName: "Distributed Systems",
        sessionDate: new Date().toISOString().split("T")[0],
        status: "PRESENT",
        remarks: "Verified via Bluetooth BLE Beacon • Turing Hall 204",
      });
    }, 1200);
  };

  const handleSyncLms = () => {
    setSyncingLms(true);
    setTimeout(() => setSyncingLms(false), 1000);
  };

  return (
    <div className="flex flex-col w-full gap-5">
      {/* TOP CONTEXT BAR & ACADEMIC KPI ROW */}
      <section className="flex flex-col gap-4">
        {/* Greeting & System State Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[var(--brand-indigo)] shadow-xs">
              <span className="material-symbols-outlined text-2xl">school</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  Good morning, {activePersona.name}
                </h1>
                <span className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] font-semibold px-2 py-0.5 rounded font-mono">
                  {activePersona.department}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                You have 2 lectures, 1 lab milestone, and 1 club seminar scheduled today • Turing Quad sync active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="flex items-center gap-1.5 bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-md text-[var(--text-secondary)] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Term W7 • Day 44/90</span>
            </div>
            <button
              onClick={handleSyncLms}
              className="flex items-center gap-1.5 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-interactive)] text-[var(--text-primary)] px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <span className={`material-symbols-outlined text-sm text-[var(--text-muted)] ${syncingLms ? "animate-spin" : ""}`}>
                sync
              </span>
              <span>{syncingLms ? "Syncing..." : "Sync LMS"}</span>
            </button>
          </div>
        </div>

        {/* 4 High-Density Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Attendance KPI */}
          <div className="flex flex-col justify-between bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs hover:border-[var(--border-interactive)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Overall Attendance
              </span>
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-lg">fact_check</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">94.8%</span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                +1.2%
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Safe margin: <strong className="text-[var(--text-primary)] font-medium">4 lectures</strong></span>
              <span>Min req: 80%</span>
            </div>
          </div>

          {/* Academic Standing */}
          <div className="flex flex-col justify-between bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs hover:border-[var(--border-interactive)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Cumulative GPA
              </span>
              <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center text-[var(--brand-indigo)]">
                <span className="material-symbols-outlined text-lg">military_tech</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">3.92</span>
              <span className="text-xs text-[var(--text-muted)] font-normal">/ 4.00</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Rank <strong className="text-[var(--text-primary)] font-medium">#14</strong> of 420</span>
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono">
                Top 3.3%
              </span>
            </div>
          </div>

          {/* Pending Deliverables */}
          <div className="flex flex-col justify-between bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs hover:border-[var(--border-interactive)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Pending Deliverables
              </span>
              <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400">
                <span className="material-symbols-outlined text-lg">pending_actions</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">3 Due</span>
              <span className="text-xs text-[var(--text-muted)]">this week</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="truncate">CS 341 Lab 3 in <strong className="text-amber-400 font-medium">14h</strong></span>
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded font-mono">
                Urgent
              </span>
            </div>
          </div>

          {/* Campus Passes */}
          <div className="flex flex-col justify-between bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs hover:border-[var(--border-interactive)] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Campus Passes
              </span>
              <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400">
                <span className="material-symbols-outlined text-lg">confirmation_number</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">2 Active</span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                Confirmed
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="truncate">CampusHack &amp; RoboCamp</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">QR ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DENSE COMMAND GRID (8 cols left / 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER COLUMN (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">
          {/* PROACTIVE CAMPUS AI BRIEFING BANNER */}
          {!bannerDismissed && (
            <div className="relative overflow-hidden bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl shadow-xs">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500"></div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[var(--brand-indigo)] shadow-xs">
                    <span className="material-symbols-outlined text-xl">auto_awesome</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-wider text-[var(--brand-indigo)] font-bold text-[11px]">
                        CampusOS Synthetics
                      </span>
                      <span className="text-[var(--border-interactive)]">•</span>
                      <span className="text-[var(--text-muted)] text-[11px]">Just now</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-primary)] leading-snug">
                      <span className="text-[var(--brand-indigo)] font-semibold">AI Observation:</span> Distributed Systems Quiz 3 historically tests <strong>Raft consensus leader election</strong> edge cases. 3 relevant lecture slide decks and 1 paper are indexed in your Course Vault.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveTab("ai")}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded-md transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        <span>Review Flash Summary (4m)</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("ai")}
                        className="flex items-center gap-1.5 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-interactive)] text-[var(--text-primary)] font-medium text-xs px-3 py-1.5 rounded-md transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">quiz</span>
                        <span>Practice 5 Mock Questions</span>
                      </button>
                      <span className="text-xs text-[var(--text-muted)] ml-1 font-medium font-mono">
                        Predictive confidence: 91%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="self-start text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
                  title="Dismiss suggestion"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>
          )}

          {/* TODAY'S LIVE SCHEDULE TIMELINE */}
          <section className="bg-[var(--surface)] border border-[var(--border-subtle)] p-5 rounded-xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--brand-indigo)] text-xl">schedule</span>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Today&apos;s Academic Timeline</h2>
              </div>
              <span className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-1 rounded-md text-xs font-medium font-mono">
                Thursday, Term W7
              </span>
            </div>

            <div className="space-y-3">
              {/* Live Item: CS 341 */}
              <div className="relative bg-[var(--surface-raised)] border border-emerald-500/30 p-4 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                <div className="flex items-start gap-3.5 pl-1">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shrink-0 text-center shadow-xs">
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">10:30</span>
                    <span className="text-sm font-bold text-[var(--text-primary)] leading-none">AM</span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5">80 min</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        CS 341: Distributed Systems &amp; Consensus
                      </span>
                      <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[11px] font-semibold font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Starts in 35m
                      </span>
                      <span className="bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] px-1.5 py-0.5 rounded text-[10px] font-mono">
                        Lecture #14
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
                        <span className="material-symbols-outlined text-sm text-[var(--brand-indigo)]">pin_drop</span>
                        Turing Hall 204 (2nd Floor)
                      </span>
                      <span>•</span>
                      <span>Prof. David Thorne</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">Bluetooth Beacon in Range</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setActiveTab("timetable")}
                    className="flex items-center gap-1 bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-xs px-2.5 py-1.5 rounded-md transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">directions</span>
                    <span>Room Map</span>
                  </button>
                  <button
                    onClick={handleBleCheckin}
                    disabled={bleCheckedIn || bleLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      bleCheckedIn
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {bleCheckedIn ? "check_circle" : bleLoading ? "sync" : "bluetooth"}
                    </span>
                    <span>{bleCheckedIn ? "Checked In!" : bleLoading ? "Verifying BLE..." : "One-Tap Check-in"}</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Item: MATH 280 */}
              <div className="bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-interactive)] p-4 rounded-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                <div className="flex items-start gap-3.5 pl-1">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-lg shrink-0 text-center">
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">02:00</span>
                    <span className="text-sm font-bold text-[var(--text-primary)] leading-none">PM</span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5">50 min</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        MATH 280: Stochastic Models
                      </span>
                      <span className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded text-[10px] font-mono">
                        Problem Session
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">pin_drop</span>
                        Hilbert Center 118
                      </span>
                      <span>•</span>
                      <span>Dr. Aris Vance</span>
                      <span>•</span>
                      <span>Markov Chains &amp; Stationary Dist.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setActiveTab("timetable")}
                    className="flex items-center gap-1 bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-1.5 rounded-md font-medium text-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">menu_book</span>
                    <span>Open Slides</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* COURSE PERFORMANCE & ATTENDANCE MATRIX */}
          <section className="bg-[var(--surface)] border border-[var(--border-subtle)] p-5 rounded-xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">table_chart</span>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Semester Enrolled Courses &amp; Standing
                </h2>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono">Fall 2026 • 16.0 Units</span>
            </div>

            <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider text-[11px] font-mono">
                    <th className="py-2.5 px-4">Code &amp; Title</th>
                    <th className="py-2.5 px-4">Faculty</th>
                    <th className="py-2.5 px-4">Attendance</th>
                    <th className="py-2.5 px-4 text-center">Grade</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
                  <tr className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)] text-sm">CS 341</div>
                      <div className="text-[var(--text-muted)] text-xs">Distributed Systems (4.0)</div>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">Prof. D. Thorne</td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[var(--surface-raised)] border border-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-[96%]"></div>
                        </div>
                        <span className="font-semibold font-mono text-emerald-400 text-xs">96.0%</span>
                      </div>
                      <span className="text-[var(--text-muted)] text-[11px]">24 / 25 attended</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded text-[11px] font-mono">
                        A (94.2)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveTab("resources")}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                        title="Open Syllabus & Resources"
                      >
                        <span className="material-symbols-outlined text-base">folder_open</span>
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)] text-sm">CS 370</div>
                      <div className="text-[var(--text-muted)] text-xs">Machine Learning &amp; Neural Nets (4.0)</div>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">Dr. S. Kazi</td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[var(--surface-raised)] border border-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-[92%]"></div>
                        </div>
                        <span className="font-semibold font-mono text-emerald-400 text-xs">92.0%</span>
                      </div>
                      <span className="text-[var(--text-muted)] text-[11px]">23 / 25 attended</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded text-[11px] font-mono">
                        A- (91.8)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveTab("resources")}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors"
                        title="Open Syllabus & Resources"
                      >
                        <span className="material-symbols-outlined text-base">folder_open</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* FAST QUICK ACTIONS WIDGET */}
          <section className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs flex flex-col gap-2.5">
            <span className="uppercase tracking-wider text-[var(--text-muted)] text-[10px] font-bold">
              Fast Student Actions
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="w-full flex items-center justify-between bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] p-2.5 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-indigo)] transition-colors">
                      Instant Attendance QR
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Rotates every 15s • Anti-spoof</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[var(--text-muted)] text-base">chevron_right</span>
              </button>

              <button
                onClick={() => setActiveTab("resources")}
                className="w-full flex items-center justify-between bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] p-2.5 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[var(--brand-indigo)]">
                    <span className="material-symbols-outlined text-lg">meeting_room</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-indigo)] transition-colors">
                      Library Pod 4B Booking
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Free from 12:00 PM • Soundproof</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[var(--text-muted)] text-base">chevron_right</span>
              </button>
            </div>
          </section>

          {/* CAMPUS PULSE & EVENT RADAR */}
          <section className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">radar</span>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Campus Event Radar</h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                2 Confirmed
              </span>
            </div>

            <div className="rounded-lg overflow-hidden bg-[var(--surface-raised)] border border-[var(--border-subtle)] shadow-xs flex flex-col">
              <div className="p-3.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/10 border border-indigo-500/20 text-[var(--brand-indigo)] text-[10px] font-semibold px-2 py-0.5 rounded font-mono">
                    Flagship Hackathon
                  </span>
                  <span className="text-[var(--text-muted)] text-[11px] font-mono">• 36 Hours</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  CampusHack 2026: Autonomous Edge AI
                </h3>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                  Turing Innovation Hall &amp; Labs. Your team pass is confirmed. Mentors from Google GenAI &amp; Stripe.
                </p>
                <div className="mt-1 flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[11px] text-emerald-400 font-mono font-medium">Oct 15 - 16</span>
                  <button
                    onClick={() => setActiveTab("events")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-2.5 py-1 rounded-md transition-colors shadow-xs"
                  >
                    View Pass
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* CAMPUS HEALTH / FACILITY STATUS MINI-TELEMETRY */}
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-xs flex flex-col gap-2">
            <span className="uppercase tracking-wider text-[var(--text-muted)] text-[10px] font-bold">
              Campus Node Telemetry
            </span>
            <div className="mt-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Central Library Quiet Level 3
                </span>
                <span className="text-emerald-400 font-medium font-mono text-[11px]">Low Density (24%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  GPU Computing Slurm Cluster
                </span>
                <span className="text-amber-400 font-medium font-mono text-[11px]">Queue &lt; 2 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal (Interactive) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] p-6 rounded-2xl shadow-xl max-w-sm w-full flex flex-col items-center gap-4 text-center border border-[var(--border-subtle)] relative">
            <div className="flex items-center justify-between w-full">
              <span className="uppercase tracking-wider text-emerald-400 font-bold text-xs font-mono">
                Dynamic Student ID
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl flex flex-col items-center">
              <div className="w-44 h-44 bg-white p-3 rounded-lg flex items-center justify-center">
                <svg className="w-full h-full text-slate-950" fill="currentColor" viewBox="0 0 100 100">
                  <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                  <rect x="10" y="10" width="15" height="15" fill="#FFFFFF" />
                  <rect x="13" y="13" width="9" height="9" fill="currentColor" />
                  <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                  <rect x="75" y="10" width="15" height="15" fill="#FFFFFF" />
                  <rect x="78" y="13" width="9" height="9" fill="currentColor" />
                  <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                  <rect x="10" y="75" width="15" height="15" fill="#FFFFFF" />
                  <rect x="13" y="78" width="9" height="9" fill="currentColor" />
                  <rect x="35" y="8" width="6" height="6" />
                  <rect x="45" y="8" width="6" height="6" />
                  <rect x="55" y="8" width="6" height="6" />
                  <rect x="36" y="35" width="18" height="18" />
                  <rect x="60" y="38" width="8" height="8" />
                  <rect x="35" y="60" width="12" height="6" />
                  <rect x="65" y="62" width="10" height="6" />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-[var(--text-primary)]">{activePersona.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                ID: {activePersona.id} • {activePersona.department}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-emerald-400 text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 py-1 px-2.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Valid for CS 341 Check-in (15s)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
