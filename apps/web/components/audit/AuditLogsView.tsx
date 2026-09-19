"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Shield, Clock, Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, Badge } from "@campusos/ui";

export function AuditLogsView() {
  const { activePersona } = useApp();
  const [logs] = useState(() => demoDb.getAuditLogs());

  if (activePersona.role !== "ADMIN") {
    return (
      <Card
        variant="default"
        className="p-8 text-center bg-[var(--status-critical-surface)] border-[var(--status-critical-border)] text-[var(--status-critical)] text-xs"
      >
        Access Denied. Only the ADMIN persona can inspect immutable security audit trails.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Security & Mutation Audit Logs
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Immutable ledger of consequential events, role escalations, transactions, and resource allocations.
        </p>
      </div>

      <Card variant="default">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--brand-indigo)]" />
            <CardTitle>Security Ledger</CardTitle>
          </div>
          <Badge variant="success" size="sm" withDot>
            Tamper Evident
          </Badge>
        </CardHeader>

        <div className="divide-y divide-[var(--border-subtle)]">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 space-y-2 text-xs hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-[var(--brand-indigo)] text-xs">
                  {log.action}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {new Date(log.createdAt || "2026-09-18T12:00:00Z").toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span>
                  Actor: <strong className="text-[var(--text-primary)]">{log.actorId}</strong>
                </span>
                <span>•</span>
                <span>
                  Target: {log.resourceType} ({log.resourceId})
                </span>
                <span>•</span>
                <span className="font-mono">IP: {log.ipAddress}</span>
              </div>

              {log.changes && (
                <pre className="mt-2 p-2.5 rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
