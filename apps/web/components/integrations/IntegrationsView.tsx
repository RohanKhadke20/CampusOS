"use client";

import React, { useEffect, useState } from "react";
import { Sliders, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck } from "lucide-react";
import { CAMPUSOS_MCP_TOOLS } from "@campusos/mcp-server";

export function IntegrationsView() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Integrations & MCP Infrastructure
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time connectivity status, service telemetry, and Model Context Protocol (MCP) server tools.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--foreground)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData?.services &&
          Object.entries(healthData.services).map(([key, svc]: [string, any]) => (
            <div
              key={key}
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase">
                  {svc.name || key}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    svc.status === "connected" || svc.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {svc.status}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {svc.message || (svc.isMock ? "Demo Fallback Active" : "Operational")}
              </div>
            </div>
          ))}
      </div>

      {/* Model Context Protocol (MCP) Tools Registry */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-[var(--foreground)]">
              Registered MCP Server Tools
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--brand-accent)]">
            @modelcontextprotocol/sdk v1.0
          </span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {CAMPUSOS_MCP_TOOLS.map((tool) => (
            <div key={tool.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {tool.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      tool.isMutating
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {tool.isMutating ? "MUTATING (REQUIRES CONFIRMATION)" : "READ ONLY"}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{tool.description}</div>
              </div>

              <div className="text-[10px] font-mono text-[var(--text-muted)] p-2 rounded bg-[var(--surface-raised)] border border-[var(--border)]">
                Props: {Object.keys(tool.inputSchema.properties || {}).join(", ") || "none"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
