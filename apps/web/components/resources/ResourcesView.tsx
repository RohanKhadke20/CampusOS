"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { Building2, MapPin, Users, CheckCircle2, Clock } from "lucide-react";

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
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Campus Facilities & Hardware Resources
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Reserve GPU computing servers, auditorium stages, 3D printers, and team project rooms.
        </p>
      </div>

      {bookedNotification && (
        <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bookedNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((res) => (
          <div
            key={res.id}
            className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between hover:border-indigo-500/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">
                  {res.type}
                </span>
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                    res.isAvailable
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {res.isAvailable ? "Available" : "Reserved"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--foreground)] mt-1">{res.name}</h3>

              <div className="mt-4 space-y-1.5 text-xs text-[var(--text-muted)]">
                {res.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{res.location}</span>
                  </div>
                )}
                {res.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Capacity: {res.capacity} seats</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => handleBookResource(res.id!, res.name)}
                disabled={!res.isAvailable}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                  res.isAvailable
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
                }`}
              >
                {res.isAvailable ? "Reserve Slot" : "Occupied"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
