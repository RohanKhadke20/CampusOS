"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";

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
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] z-50 flex items-center justify-between px-5 shadow-xs">
        <div className="flex items-center gap-6">
          {/* Logo & Term Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <span className="text-base font-bold tracking-tight flex items-center text-[var(--text-primary)]">
              Campus<span className="text-[var(--brand-indigo)]">OS</span>
            </span>
            <span className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono">
              v2.4 LTS
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md text-[var(--text-secondary)] text-xs">
            <span className="material-symbols-outlined text-sm text-emerald-500">event_upcoming</span>
            <span className="font-medium text-[var(--text-primary)]">Fall 2026</span>
            <span className="text-[var(--border-interactive)]">•</span>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[11px] font-semibold">
              Week 7
            </span>
          </div>
        </div>

        {/* Global Command Search */}
        <div className="flex-1 max-w-xl mx-6 hidden lg:block">
          <button
            onClick={() => setActiveTab("ai")}
            className="w-full flex items-center justify-between bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-3.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:border-[var(--border-interactive)] hover:bg-[var(--surface)] transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                search
              </span>
              <span className="text-xs text-[var(--text-muted)] font-normal">
                Search courses, clubs, rooms, or ask Campus AI...
              </span>
            </div>
            <kbd className="bg-[var(--surface)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[11px] font-mono text-[var(--text-muted)] shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Header Actions & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("ai")}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[var(--brand-indigo)] px-3 py-1.5 rounded-md transition-all shadow-xs text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span>Ask Copilot ✦</span>
          </button>

          <button
            onClick={handleSos}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
              sosActive
                ? "bg-red-500 text-white border-red-600 animate-pulse"
                : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            }`}
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>{sosActive ? "CAMPUS SEC ALERTED" : "SOS"}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-md transition-colors"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-lg">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Persona Switcher Menu */}
          <div className="flex items-center gap-1.5 bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2 py-1 rounded-md text-xs">
            <span className="text-[11px] text-[var(--text-muted)] mr-1 hidden sm:inline">Role:</span>
            {personas.map((p) => (
              <button
                key={p.role}
                onClick={() => setPersona(p.role)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  activePersona.role === p.role
                    ? "bg-indigo-600 text-white shadow-xs"
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
                className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)]"></span>
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-500/10 border border-indigo-500/30 text-[var(--brand-indigo)] font-semibold shadow-xs"
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
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-[10px] font-mono">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] space-y-1.5">
          <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-[11px] font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GCal Synced • Live</span>
          </div>

          <div className="px-2 text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Demo Mode Active</span>
            <span className="text-indigo-400 font-mono">Zero Creds</span>
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <div className="pl-64 pt-16 flex-1 flex flex-col">
        <div className="w-full min-h-screen p-6 md:p-8 bg-[var(--canvas)]">
          {children}
        </div>
      </div>
    </div>
  );
}
