"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppContext";
import {
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Tag,
  Share2,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "@campusos/ui";

export function EventDetailsClient({ slug }: { slug: string }) {
  const { activePersona } = useApp();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [registering, setRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${slug}`);
      if (res.ok) {
        const json = await res.json();
        const ev = json.data;
        setEvent(ev);
        if (ev.userRegistration) {
          setRegistrationResult(ev.userRegistration);
        }
        if (ev.tickets && ev.tickets.length > 0) {
          setSelectedTicketId(ev.tickets[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRegister = async () => {
    if (!event || !selectedTicketId) return;
    try {
      setRegistering(true);
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicketId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrationResult(data.data);
        fetchEvent();
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16 space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Event Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          The event you are looking for may have been rescheduled or removed.
        </p>
        <Link href="/events">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to All Events
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back link */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discovery</span>
        </Link>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-[var(--border-subtle)] shadow-md">
        <div className="h-64 sm:h-80 w-full relative">
          <img
            src={
              event.bannerUrl ||
              "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200"
            }
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="brand">{event.status}</Badge>
              <Badge variant={event.isPaid ? "warning" : "success"}>
                {event.isPaid ? "Paid Pass Required" : "Free Campus Admission"}
              </Badge>
            </div>
            {registrationResult && (
              <Badge variant="success" className="bg-emerald-500 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registration Verified
              </Badge>
            )}
          </div>

          {/* Title & Host info */}
          <div className="absolute bottom-4 left-5 right-5 text-white space-y-1.5">
            {event.organization && (
              <div className="flex items-center gap-2 text-xs text-indigo-200">
                <span>Hosted by {event.organization.name}</span>
                {event.organization.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight drop-shadow-md">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Ticket / Pass Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Event Specs */}
        <div className="md:col-span-2 space-y-6">
          {/* Logistics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo)]/10 flex items-center justify-center text-[var(--brand-indigo)] flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Date & Time
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                  {new Date(event.startTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {new Date(event.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(event.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo)]/10 flex items-center justify-center text-[var(--brand-indigo)] flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Campus Venue
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                  {event.venue}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Capacity: {event.maxCapacity} seats ({event.registrationCount} filled)
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card variant="default">
            <CardContent className="space-y-3 p-5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                Event Overview
              </h3>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
                <p>{event.description}</p>
                <p>
                  Attendees will receive official certificate credits recorded directly onto their
                  verified academic profile. Refreshments and developer swag will be provided.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Registration / Pass Widget */}
        <div className="space-y-4">
          {registrationResult ? (
            /* VERIFIED PASS CARD */
            <div className="p-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 backdrop-blur-sm space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Official Pass</span>
                </div>
                <Badge variant="success" size="sm">
                  {registrationResult.status || "CONFIRMED"}
                </Badge>
              </div>

              <div className="space-y-2 text-center py-2">
                <div className="text-[10px] text-emerald-300/70 uppercase font-mono tracking-widest">
                  Registration Code
                </div>
                <div className="text-base font-mono font-bold text-emerald-300 tracking-wider">
                  {registrationResult.registrationNumber}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Holder:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{activePersona.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Student ID:</span>
                  <span className="font-mono text-[var(--text-secondary)]">{activePersona.studentId || "CS-2024-042"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Check-in:</span>
                  <span className={registrationResult.checkInTime ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                    {registrationResult.checkInTime ? "Verified" : "Pending Arrival"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 flex items-center justify-center gap-2 text-xs text-emerald-300">
                <QrCode className="w-5 h-5" />
                <span className="text-[11px] font-medium">Valid for Admission</span>
              </div>
            </div>
          ) : (
            /* TICKET REGISTRATION FORM */
            <Card variant="highlight" className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Ticket className="w-4 h-4 text-[var(--brand-indigo)]" />
                  Select Pass Tier
                </h3>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {event.tickets?.length || 0} tier(s)
                </span>
              </div>

              <div className="space-y-2.5">
                {event.tickets?.map((tkt: any) => {
                  const isSelected = selectedTicketId === tkt.id;
                  const isSoldOut = tkt.quantityAvailable > 0 && tkt.quantitySold >= tkt.quantityAvailable;

                  return (
                    <div
                      key={tkt.id}
                      onClick={() => !isSoldOut && setSelectedTicketId(tkt.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-[var(--brand-indigo)] shadow-sm"
                          : isSoldOut
                          ? "opacity-50 cursor-not-allowed bg-[var(--surface)] border-[var(--border-subtle)]"
                          : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-interactive)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[var(--brand-indigo)] bg-[var(--brand-indigo)]"
                              : "border-[var(--border-subtle)]"
                          }`}
                        >
                          {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">
                            {tkt.title}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {tkt.quantityAvailable - (tkt.quantitySold || 0)} available
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                        {tkt.priceCents === 0 ? "Free" : `₹${(tkt.priceCents / 100).toFixed(0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button
                  size="md"
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleRegister}
                  disabled={registering || !selectedTicketId}
                >
                  {registering ? "Confirming Pass..." : "Register Now"}
                </Button>
              </div>

              <p className="text-[10px] text-center text-[var(--text-muted)] leading-normal">
                By registering you confirm attendance and compliance with university code of conduct.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
