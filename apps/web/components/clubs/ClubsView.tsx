"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Users, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";

export function ClubsView() {
  const { activePersona } = useApp();
  const [organizations] = useState(() => demoDb.getOrganizations());
  const [joinedOrgs, setJoinedOrgs] = useState<string[]>(["org-acm-01"]);

  const handleToggleJoin = (orgId: string) => {
    if (joinedOrgs.includes(orgId)) {
      setJoinedOrgs(joinedOrgs.filter((id) => id !== orgId));
    } else {
      setJoinedOrgs([...joinedOrgs, orgId]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Clubs & Student Societies
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Explore student-run technical societies, creative arts collectives, and engineering clubs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {organizations.map((org) => {
          const isMember = joinedOrgs.includes(org.id);
          return (
            <div
              key={org.id}
              className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between hover:border-indigo-500/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--border)]"
                  />
                  {org.isVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    {org.category}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--foreground)] mt-0.5">
                    {org.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    {org.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {isMember ? "Active Member" : "Open for membership"}
                </span>
                <button
                  onClick={() => handleToggleJoin(org.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isMember
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  }`}
                >
                  {isMember ? "Joined" : "Join Society"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
