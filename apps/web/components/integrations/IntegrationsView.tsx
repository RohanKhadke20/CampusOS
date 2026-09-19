"use client";

import React, { useEffect, useState } from "react";
import { Sliders, RefreshCw, Layers } from "lucide-react";
import { CAMPUSOS_MCP_TOOLS } from "@campusos/mcp-server";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@campusos/ui";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Integrations & MCP Infrastructure
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time connectivity status, service telemetry, and Model Context Protocol (MCP) server tools.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={fetchHealth}
          disabled={loading}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
        >
          Refresh Diagnostics
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData?.services &&
          Object.entries(healthData.services).map(([key, svc]: [string, any]) => (
            <Card key={key} variant="default" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  {svc.name || key}
                </span>
                <Badge
                  variant={
                    svc.status === "connected" || svc.status === "active"
                      ? "success"
                      : "warning"
                  }
                  size="sm"
                  withDot
                >
                  {svc.status}
                </Badge>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {svc.message || (svc.isMock ? "Demo Fallback Active" : "Operational")}
              </div>
            </Card>
          ))}
      </div>

      {/* Model Context Protocol (MCP) Tools Registry */}
      <Card variant="default">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--brand-indigo)]" />
            <CardTitle>Registered MCP Server Tools</CardTitle>
          </div>
          <Badge variant="brand" size="sm">
            @modelcontextprotocol/sdk v1.0
          </Badge>
        </CardHeader>

        <div className="divide-y divide-[var(--border-subtle)]">
          {CAMPUSOS_MCP_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--brand-indigo)]">
                    {tool.name}
                  </span>
                  <Badge
                    variant={tool.isMutating ? "warning" : "success"}
                    size="sm"
                  >
                    {tool.isMutating ? "MUTATING (CONFIRMATION REQUIRED)" : "READ ONLY"}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  {tool.description}
                </div>
              </div>

              <div className="text-[10px] font-mono text-[var(--text-muted)] p-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] shrink-0">
                Props: {Object.keys(tool.inputSchema.properties || {}).join(", ") || "none"}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
