"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Shield, Users, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@campusos/ui";

export function AdminView() {
  const { activePersona } = useApp();
  const [users, setUsers] = useState(() => demoDb.getUsers());
  const [elevatedUser, setElevatedUser] = useState<string | null>(null);

  const handlePromote = (userId: string) => {
    setElevatedUser(`User ${userId} permissions updated.`);
    setTimeout(() => setElevatedUser(null), 3000);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "critical";
      case "ORGANIZER":
        return "brand";
      case "FACULTY":
        return "info";
      default:
        return "neutral";
    }
  };

  if (activePersona.role !== "ADMIN") {
    return (
      <Card variant="default" className="p-8 text-center bg-[var(--status-critical-surface)] border-[var(--status-critical-border)] text-[var(--status-critical)] text-xs">
        Access Denied. You must switch to the ADMIN persona from the top navigation to view this console.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Campus Administrator Console
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage student enrollments, faculty profiles, and role escalations.
        </p>
      </div>

      {elevatedUser && (
        <div className="p-3 rounded-lg bg-[var(--status-success-surface)] border border-[var(--status-success-border)] text-[var(--status-success)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{elevatedUser}</span>
        </div>
      )}

      <Card variant="default">
        <CardHeader>
          <CardTitle>Registered Campus Accounts & Roles</CardTitle>
        </CardHeader>

        <div className="divide-y divide-[var(--border-subtle)]">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={u.profile?.avatarUrl || ""}
                  alt={u.profile?.fullName || ""}
                  className="w-9 h-9 rounded-full object-cover border border-[var(--border-subtle)] bg-[var(--surface-raised)]"
                />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {u.profile?.fullName}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">{u.email}</div>
                  <div className="text-[10px] text-[var(--brand-indigo)] font-mono">
                    ID: {u.profile?.studentId || "Faculty"} • {u.profile?.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                  {u.role}
                </Badge>

                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => handlePromote(u.id)}
                >
                  Manage Permissions
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
