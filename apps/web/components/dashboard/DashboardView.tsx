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
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
} from "@campusos/ui";

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
      <Card variant="highlight" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                {activePersona.role} PORTAL
              </Badge>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Academic Term 2026-II
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
              Welcome back, {activePersona.name}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              You have 2 classes today, 1 pending lab report due tomorrow, and CampusHack begins in 26 days.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="md"
              variant="primary"
              onClick={() => setActiveTab("ai")}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Ask Campus AI
            </Button>
            <Button
              size="md"
              variant={quickCheckinSuccess ? "success" : "secondary"}
              onClick={handleSimulateCheckin}
              leftIcon={
                quickCheckinSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4 text-[var(--brand-indigo)]" />
                )
              }
            >
              {quickCheckinSuccess ? "Checked In!" : "Simulate GPS Check-in"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value="94.2%"
          subtitle="Eligible for final exams"
          variant="success"
          trend={{ value: "+1.2%", isPositive: true }}
          icon={<TrendingUp className="w-4 h-4 text-[var(--status-success)]" />}
        />
        <StatCard
          title="Upcoming Events"
          value="2 Active"
          subtitle="CampusHack 2026 & RoboCamp"
          variant="brand"
          icon={<Calendar className="w-4 h-4 text-[var(--brand-indigo)]" />}
        />
        <StatCard
          title="Pending Tasks"
          value="2 Due"
          subtitle="Machine Learning Lab Report"
          variant="warning"
          icon={<AlertCircle className="w-4 h-4 text-[var(--status-warning)]" />}
        />
        <StatCard
          title="Club Memberships"
          value="3 Societies"
          subtitle="ACM • Robotics • Design"
          variant="default"
          icon={<Flame className="w-4 h-4 text-[var(--status-critical)]" />}
        />
      </div>

      {/* Main Grid: Today's Timetable + Featured Hackathon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Today&apos;s Academic Schedule
            </h2>
            <button
              onClick={() => setActiveTab("timetable")}
              className="text-xs text-[var(--brand-indigo)] hover:underline font-medium flex items-center gap-1 focus-ring"
            >
              Full Timetable <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            <Card variant="interactive" className="p-3.5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] flex flex-col items-center justify-center font-mono text-xs font-semibold">
                  <span>10:00</span>
                  <span className="text-[9px] opacity-70">AM</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    CS601: Distributed Systems & Consensus
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Hall B-201 • Dr. Marcus Vance
                  </div>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Attended
              </Badge>
            </Card>

            <Card variant="interactive" className="p-3.5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] text-[var(--text-secondary)] flex flex-col items-center justify-center font-mono text-xs font-semibold">
                  <span>02:30</span>
                  <span className="text-[9px] opacity-70">PM</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    CS602: Artificial Intelligence & Edge Robotics
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Robotics Arena • Prof. Ananya Roy
                  </div>
                </div>
              </div>
              <Badge variant="warning" size="sm">
                Upcoming
              </Badge>
            </Card>
          </div>
        </div>

        {/* Right Col: Featured Hackathon Card */}
        <div>
          <Card variant="default" className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <Badge variant="brand" size="sm">
                  Flagship Event
                </Badge>
                <span className="text-xs text-[var(--text-muted)] font-mono">26d left</span>
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                CampusHack 2026: Autonomous Edge AI
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                48-hour collaborative engineering hackathon focused on on-device ML models and zero-trust IoT.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--status-success)]">
                Free Student RSVP
              </span>
              <Button
                size="xs"
                variant="primary"
                onClick={() => setActiveTab("events")}
              >
                View Tickets
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
