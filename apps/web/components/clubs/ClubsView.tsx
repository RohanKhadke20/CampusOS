"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Users, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, Button, Badge } from "@campusos/ui";

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
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Clubs & Student Societies
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Explore student-run technical societies, creative arts collectives, and engineering clubs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {organizations.map((org) => {
          const isMember = joinedOrgs.includes(org.id);
          return (
            <Card
              key={org.id}
              variant="default"
              className="flex flex-col justify-between hover:border-[var(--border-interactive)] transition-all duration-150"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--border-subtle)] bg-[var(--surface-raised)]"
                  />
                  {org.isVerified && (
                    <Badge variant="success" size="sm" withDot>
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--brand-indigo)] font-semibold">
                    {org.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-1 tracking-tight">
                    {org.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-3">
                    {org.description}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-4 bg-[var(--surface-raised)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {isMember ? "Active Member" : "Open for membership"}
                </span>
                <Button
                  size="xs"
                  variant={isMember ? "success" : "primary"}
                  onClick={() => handleToggleJoin(org.id)}
                  leftIcon={isMember ? <CheckCircle2 className="w-3 h-3" /> : undefined}
                >
                  {isMember ? "Joined" : "Join Society"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
