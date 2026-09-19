"use client";

import React from "react";
import { useApp } from "../AppContext";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CheckSquare,
  Clock,
  UserCheck,
  Building2,
  CreditCard,
  Bot,
  Sliders,
  Shield,
  FileText,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { Badge } from "@campusos/ui";

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({}: SidebarProps) {
  const { activeTab, setActiveTab, activePersona, setPersona, personas, theme, toggleTheme } = useApp();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "events", label: "Events & Tickets", icon: CalendarDays, badge: "Live" },
    { id: "clubs", label: "Clubs & Societies", icon: Users, badge: null },
    { id: "tasks", label: "Tasks & Projects", icon: CheckSquare, badge: null },
    { id: "timetable", label: "Academic Timetable", icon: Clock, badge: null },
    { id: "attendance", label: "Attendance", icon: UserCheck, badge: "94%" },
    { id: "resources", label: "Campus Resources", icon: Building2, badge: null },
    { id: "payments", label: "Payments", icon: CreditCard, badge: null },
    { id: "ai", label: "AI Assistant", icon: Bot, badge: "Gemini" },
    { id: "integrations", label: "Integrations & MCP", icon: Sliders, badge: null },
  ];

  // Admin and Organizer conditional items
  if (activePersona.role === "ADMIN") {
    navItems.push(
      { id: "admin", label: "Admin Console", icon: Shield, badge: "Master" },
      { id: "audit", label: "Audit Logs", icon: FileText, badge: null }
    );
  }

  return (
    <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col justify-between h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo)] flex items-center justify-center text-white font-bold shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight leading-none text-[var(--text-primary)]">
                CampusOS
              </div>
              <div className="text-[10px] text-[var(--brand-indigo)] font-mono font-medium mt-0.5">
                v2.4 • Command Center
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors focus-ring"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Demo Mode Badge */}
        <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-[var(--status-warning-surface)] border border-[var(--status-warning-border)] text-[var(--status-warning)] text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)] animate-pulse"></span>
            Demo Mode Active
          </span>
          <span className="text-[10px] opacity-80 font-mono">Zero Creds</span>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 focus-ring ${
                  isActive
                    ? "bg-[var(--brand-indigo)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[var(--text-muted)]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive ? "neutral" : "brand"}
                    size="sm"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role & Persona Switcher */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] mb-2 px-1">
          Switch Persona
        </div>
        <div className="grid grid-cols-3 gap-1 mb-3">
          {personas.map((p) => (
            <button
              key={p.role}
              onClick={() => setPersona(p.role)}
              className={`text-[10px] py-1 px-1.5 rounded font-medium transition-colors focus-ring ${
                activePersona.role === p.role
                  ? "bg-[var(--brand-indigo)] text-white"
                  : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
              }`}
            >
              {p.role}
            </button>
          ))}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]">
          <img
            src={activePersona.avatarUrl}
            alt={activePersona.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--brand-indigo)]/40"
          />
          <div className="overflow-hidden">
            <div className="text-xs font-semibold truncate text-[var(--text-primary)]">
              {activePersona.name}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              {activePersona.department}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
