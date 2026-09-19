"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Shield, Users, Building2, UserPlus, CheckCircle2 } from "lucide-react";

export function AdminView() {
  const { activePersona } = useApp();
  const [users, setUsers] = useState(() => demoDb.getUsers());
  const [elevatedUser, setElevatedUser] = useState<string | null>(null);

  const handlePromote = (userId: string) => {
    setElevatedUser(`User ${userId} permissions updated.`);
    setTimeout(() => setElevatedUser(null), 3000);
  };

  if (activePersona.role !== "ADMIN") {
    return (
      <div className="p-8 text-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
        Access Denied. You must switch to the ADMIN persona from the sidebar to view this console.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Campus Administrator Console
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage student enrollments, faculty profiles, and role escalations.
        </p>
      </div>

      {elevatedUser && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{elevatedUser}</span>
        </div>
      )}

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] text-xs font-bold text-[var(--foreground)]">
          Registered Campus Accounts & Roles
        </div>

        <div className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={u.profile?.avatarUrl || ""}
                  alt={u.profile?.fullName || ""}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-[var(--foreground)]">
                    {u.profile?.fullName}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">{u.email}</div>
                  <div className="text-[10px] text-[var(--brand-accent)]">
                    ID: {u.profile?.studentId || "Faculty"} • {u.profile?.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    u.role === "ADMIN"
                      ? "bg-rose-500/10 text-rose-400"
                      : u.role === "ORGANIZER"
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "bg-cyan-500/10 text-cyan-400"
                  }`}
                >
                  {u.role}
                </span>

                <button
                  onClick={() => handlePromote(u.id)}
                  className="px-2.5 py-1 rounded bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] text-[var(--foreground)]"
                >
                  Manage Permissions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
