"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { UserCheck, QrCode, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export function AttendanceView() {
  const { activePersona } = useApp();
  const [attendance, setAttendance] = useState(() => demoDb.getAttendance(activePersona.id));
  const [simulatedCode, setSimulatedCode] = useState("");
  const [checkinAlert, setCheckinAlert] = useState<string | null>(null);

  const handleSimulateQRCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCode) return;

    demoDb.recordAttendance({
      userId: activePersona.id,
      subjectCode: "CS601",
      subjectName: "Distributed Systems & Consensus",
      sessionDate: new Date().toISOString().split("T")[0],
      status: "PRESENT",
      remarks: `Verified via Session Code ${simulatedCode}`,
    });

    setAttendance(demoDb.getAttendance(activePersona.id));
    setCheckinAlert(`Attendance recorded successfully for CS601 (Code: ${simulatedCode})`);
    setSimulatedCode("");
    setTimeout(() => setCheckinAlert(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Attendance Telemetry & Check-in
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Monitor course attendance criteria, view session logs, and simulate real-time classroom check-ins.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)]">Cumulative Attendance</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">94.2%</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Status: Fully Eligible for Exam Registration
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)]">Minimum Threshold</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">75.0%</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            University Academic Regulation #104
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)]">Sessions Recorded</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {attendance.length + 28}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            0 Shortfall alerts this semester
          </div>
        </div>
      </div>

      {/* Check-in Simulator */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">
            Classroom QR / Session Code Simulator
          </h2>
        </div>

        {checkinAlert && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{checkinAlert}</span>
          </div>
        )}

        <form onSubmit={handleSimulateQRCheckin} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={simulatedCode}
            onChange={(e) => setSimulatedCode(e.target.value)}
            placeholder="Enter professor 6-digit session pin (e.g. 782104)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            Check In
          </button>
        </form>
      </div>

      {/* Session Logs Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] text-xs font-bold text-[var(--foreground)]">
          Recent Verification History
        </div>
        <div className="divide-y divide-[var(--border)]">
          {attendance.map((rec) => (
            <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-indigo-400 font-semibold">{rec.subjectCode}: </span>
                <span className="text-[var(--foreground)] font-medium">{rec.subjectName}</span>
                {rec.remarks && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{rec.remarks}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {rec.sessionDate}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  {rec.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
