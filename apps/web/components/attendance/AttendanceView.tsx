"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { UserCheck, QrCode, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@campusos/ui";

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
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Attendance Telemetry & Check-in
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Monitor course attendance criteria, view session logs, and simulate real-time classroom check-ins.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Cumulative Attendance"
          value="94.2%"
          subtitle="Status: Fully Eligible for Exams"
          variant="success"
          trend={{ value: "+2.1%", isPositive: true }}
          icon={<TrendingUp className="w-4 h-4 text-[var(--status-success)]" />}
        />
        <StatCard
          title="Minimum Threshold"
          value="75.0%"
          subtitle="University Academic Regulation #104"
          variant="brand"
          icon={<ShieldCheck className="w-4 h-4 text-[var(--brand-indigo)]" />}
        />
        <StatCard
          title="Sessions Recorded"
          value={attendance.length + 28}
          subtitle="0 Shortfall alerts this semester"
          variant="default"
          icon={<UserCheck className="w-4 h-4 text-[var(--text-secondary)]" />}
        />
      </div>

      {/* Check-in Simulator */}
      <Card variant="highlight">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[var(--brand-indigo)]" />
            <CardTitle className="text-xs uppercase tracking-wider font-mono text-[var(--brand-indigo)]">
              Classroom QR / Session Code Simulator
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {checkinAlert && (
            <div className="p-3 mb-4 rounded-lg bg-[var(--status-success-surface)] border border-[var(--status-success-border)] text-[var(--status-success)] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{checkinAlert}</span>
            </div>
          )}

          <form onSubmit={handleSimulateQRCheckin} className="flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="flex-1">
              <Input
                value={simulatedCode}
                onChange={(e) => setSimulatedCode(e.target.value)}
                placeholder="Enter professor 6-digit session pin (e.g. 782104)"
                required
              />
            </div>
            <Button type="submit" size="md" variant="primary">
              Check In
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session Logs Table */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Recent Verification History</CardTitle>
        </CardHeader>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Verification Method / Remarks</TableHead>
                <TableHead>Session Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    <span className="font-mono text-[var(--brand-indigo)] font-semibold">
                      {rec.subjectCode}
                    </span>
                    <span className="text-[var(--text-primary)] font-medium ml-2">
                      {rec.subjectName}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] text-[11px]">
                    {rec.remarks || "Standard beacon verification"}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[var(--text-muted)]">
                    {rec.sessionDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={rec.status === "PRESENT" ? "success" : "critical"}
                      size="sm"
                      withDot
                    >
                      {rec.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
