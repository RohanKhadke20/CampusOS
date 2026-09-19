"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { FileText, Shield, Clock, Terminal } from "lucide-react";

export function AuditLogsView() {
  const { activePersona } = useApp();
  const [logs] = useState(() => demoDb.getAuditLogs());

  if (activePersona.role !== "ADMIN") {
    return (
      <div className="p-8 text-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
        Access Denied. Only the ADMIN persona can inspect immutable security audit trails.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Security & Mutation Audit Logs
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Immutable ledger of consequential events, role escalations, transactions, and resource allocations.
        </p>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--foreground)]">
          <span>Security Ledger</span>
          <span className="font-mono text-[10px] text-emerald-400">Tamper Evident</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {logs.map((log) => (
            <div key={log.id} className="p-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-400 text-xs">
                  {log.action}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {new Date(log.createdAt || "2026-09-18T12:00:00Z").toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span>Actor: <strong className="text-[var(--foreground)]">{log.actorId}</strong></span>
                <span>•</span>
                <span>Target: {log.resourceType} ({log.resourceId})</span>
                <span>•</span>
                <span className="font-mono">IP: {log.ipAddress}</span>
              </div>

              {log.changes && (
                <pre className="mt-2 p-2 rounded bg-[var(--background)] border border-[var(--border)] text-[10px] font-mono text-[var(--brand-accent)] overflow-x-auto">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
