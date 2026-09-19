"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { Badge, Button } from "@campusos/ui";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface StitchShellProps {
  children: React.ReactNode;
}

export function StitchShell({ children }: StitchShellProps) {
  const { activeTab, setActiveTab, activePersona, setPersona, personas, theme, toggleTheme } = useApp();
  const [sosActive, setSosActive] = useState(false);

  const handleSos = () => {
    setSosActive(true);
    setTimeout(() => setSosActive(false), 4000);
  };

  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "grid_view" },
        { id: "ai", label: "AI Assistant", icon: "psychology" },
      ],
    },
    {
      title: "Academics",
      items: [
        { id: "timetable", label: "Timetable", icon: "calendar_today" },
        { id: "attendance", label: "Attendance", icon: "fact_check", badge: "94.2%" },
        { id: "tasks", label: "Assignments & Tasks", icon: "assignment" },
        { id: "resources", label: "Campus Resources", icon: "folder_special" },
      ],
    },
    {
      title: "Life & Events",
      items: [
        { id: "events", label: "Events Discovery", icon: "celebration" },
        { id: "clubs", label: "Clubs & Orgs", icon: "groups" },
        { id: "payments", label: "Payments & Passes", icon: "confirmation_number" },
        { id: "integrations", label: "Integrations & Map", icon: "map" },
      ],
    },
    {
      title: "Governance",
      items: [
        { id: "admin", label: "Admin Command", icon: "terminal", adminOnly: true },
        { id: "audit", label: "Audit Logs", icon: "shield", adminOnly: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col">
      {/* TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--surface-glass)] backdrop-blur-md border-b border-[var(--border-subtle)] z-50 flex items-center justify-between px-5">
        <div className="flex items-center gap-6">
          {/* Logo & Term Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo)] flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <span className="text-base font-bold tracking-tight flex items-center text-[var(--text-primary)]">
              Campus<span className="text-[var(--brand-indigo)]">OS</span>
            </span>
            <Badge variant="neutral" size="sm">
              v2.4 LTS
            </Badge>
          </div>

          <div className="hidden xl:flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md text-[var(--text-secondary)] text-xs">
            <span className="material-symbols-outlined text-sm text-[var(--status-success)]">event_upcoming</span>
            <span className="font-medium text-[var(--text-primary)]">Fall 2026</span>
            <span className="text-[var(--border-interactive)]">•</span>
            <Badge variant="success" size="sm">
              Week 7
            </Badge>
          </div>
        </div>

        {/* Global Command Search */}
        <div className="flex-1 max-w-xl mx-6 hidden lg:block">
          <button
            onClick={() => setActiveTab("ai")}
            className="w-full flex items-center justify-between bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-3.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:border-[var(--border-interactive)] hover:bg-[var(--surface)] transition-all duration-150 group focus-ring"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                search
              </span>
              <span className="text-xs text-[var(--text-muted)] font-normal">
                Search courses, clubs, rooms, or ask Campus AI...
              </span>
            </div>
            <kbd className="bg-[var(--surface)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[11px] font-mono text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Header Actions & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("ai")}
            className="hidden sm:flex items-center gap-1.5 bg-[var(--brand-indigo-subtle)] hover:opacity-90 border border-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] px-3 py-1.5 rounded-lg transition-all text-xs font-semibold focus-ring"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span>Ask Copilot ✦</span>
          </button>

          <button
            onClick={handleSos}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border focus-ring ${
              sosActive
                ? "bg-[var(--status-critical)] text-white border-[var(--status-critical)] shadow-[0_0_24px_0_rgba(239,68,68,0.45)] animate-pulse"
                : "bg-[var(--status-critical-surface)] border-[var(--status-critical-border)] text-[var(--status-critical)] hover:opacity-90"
            }`}
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>{sosActive ? "CAMPUS SEC ALERTED" : "SOS"}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors focus-ring"
            title="Toggle theme"
            aria-label="Toggle color theme"
          >
            <span className="material-symbols-outlined text-lg">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Persona Switcher Menu */}
          <div className="flex items-center gap-1 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-1 rounded-lg text-xs">
            <span className="text-[11px] text-[var(--text-muted)] px-1.5 hidden sm:inline font-medium">Role:</span>
            {personas.map((p) => (
              <button
                key={p.role}
                onClick={() => setPersona(p.role)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all focus-ring ${
                  activePersona.role === p.role
                    ? "bg-[var(--brand-indigo)] text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {p.role}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
            <div className="relative">
              <img
                alt={activePersona.name}
                src={activePersona.avatarUrl}
                className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] bg-[var(--surface-raised)]"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--status-success)] ring-2 ring-[var(--surface)]"></span>
            </div>
            <div className="hidden 2xl:block text-left">
              <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                {activePersona.name}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] leading-tight">
                {activePersona.department}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* LEFT SIDEBAR */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[var(--surface)] border-r border-[var(--border-subtle)] z-40 flex flex-col justify-between overflow-y-auto px-3 py-4">
        <div className="space-y-4">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-2 uppercase tracking-wider text-[var(--text-muted)] text-[10px] font-bold">
                {sec.title}
              </div>
              <nav className="space-y-0.5">
                {sec.items.map((item) => {
                  if (item.adminOnly && activePersona.role !== "ADMIN") return null;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus-ring ${
                        isActive
                          ? "bg-[var(--brand-indigo-subtle)] border border-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] font-semibold shadow-xs"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`material-symbols-outlined text-[19px] ${
                            isActive ? "text-[var(--brand-indigo)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="success" size="sm">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--status-success-surface)] border border-[var(--status-success-border)] rounded-lg text-[var(--status-success)] text-[11px] font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse"></span>
            <span>GCal Synced • Live</span>
          </div>

          <div className="px-2 text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Demo Mode Active</span>
            <span className="text-[var(--brand-indigo)] font-mono">Zero Creds</span>
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <div className="pl-64 pt-16 flex-1 flex flex-col">
        <main className="w-full min-h-[calc(100vh-4rem)] p-6 md:p-8 bg-[var(--canvas)]">
          {children}
        </main>
      </div>
    </div>
  );
}
