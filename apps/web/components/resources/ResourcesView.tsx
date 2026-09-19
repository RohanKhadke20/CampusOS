"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Building2, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardFooter, Button, Badge } from "@campusos/ui";

export function ResourcesView() {
  const { activePersona } = useApp();
  const [resources, setResources] = useState(() => demoDb.getResources());
  const [bookedNotification, setBookedNotification] = useState<string | null>(null);

  const handleBookResource = (resId: string, name: string) => {
    demoDb.bookResource(resId, activePersona.id);
    setResources([...demoDb.getResources()]);
    setBookedNotification(`Slot reserved for "${name}". Audit log updated.`);
    setTimeout(() => setBookedNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Campus Facilities & Hardware Resources
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Reserve GPU computing servers, auditorium stages, 3D printers, and team project rooms.
        </p>
      </div>

      {bookedNotification && (
        <div className="p-3.5 rounded-lg bg-[var(--status-success-surface)] border border-[var(--status-success-border)] text-[var(--status-success)] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bookedNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {resources.map((res) => (
          <Card
            key={res.id}
            variant="default"
            className="flex flex-col justify-between hover:border-[var(--border-interactive)] transition-all duration-150"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs mb-3">
                <Badge variant="brand" size="sm">
                  {res.type}
                </Badge>
                <Badge
                  variant={res.isAvailable ? "success" : "critical"}
                  size="sm"
                  withDot
                >
                  {res.isAvailable ? "Available" : "Reserved"}
                </Badge>
              </div>

              <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                {res.name}
              </h3>

              <div className="mt-4 space-y-1.5 text-xs text-[var(--text-muted)]">
                {res.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand-indigo)]" />
                    <span>{res.location}</span>
                  </div>
                )}
                {res.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[var(--brand-indigo)]" />
                    <span>Capacity: {res.capacity} seats</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 bg-[var(--surface-raised)]">
              <Button
                variant={res.isAvailable ? "primary" : "secondary"}
                size="sm"
                className="w-full"
                disabled={!res.isAvailable}
                onClick={() => handleBookResource(res.id!, res.name)}
              >
                {res.isAvailable ? "Reserve Slot" : "Occupied"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
