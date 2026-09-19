"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import {
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Ticket,
  Plus,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";

export function EventsView() {
  const { activePersona } = useApp();
  const [events, setEvents] = useState(() => demoDb.getEvents());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [registeredBadge, setRegisteredBadge] = useState<string | null>(null);

  // New Event Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleOpenCheckout = (event: any, ticket: any) => {
    setSelectedEvent(event);
    setSelectedTicket(ticket);
    setCheckoutModalOpen(true);
    setPaymentSuccess(false);
  };

  const handleCompleteDemoCheckout = () => {
    // Record registration and payment in demo database
    const reg = demoDb.registerForEvent({
      eventId: selectedEvent.id,
      ticketId: selectedTicket.id,
      userId: activePersona.id,
      status: "CONFIRMED",
    });

    if (selectedTicket.priceCents > 0) {
      demoDb.recordPayment({
        userId: activePersona.id,
        orderId: `order_mock_${Date.now()}`,
        paymentId: `pay_mock_${Date.now()}`,
        amountCents: selectedTicket.priceCents,
        currency: "INR",
        status: "CAPTURED",
        eventTitle: selectedEvent.title,
        ticketTitle: selectedTicket.title,
      });
    }

    setRegisteredBadge(reg.registrationNumber);
    setPaymentSuccess(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue) return;

    const created = demoDb.createEvent({
      title: newTitle,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      venue: newVenue,
      description: newDesc,
      startTime: new Date(Date.now() + 86400000 * 7).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 7 + 14400000).toISOString(),
      status: "PUBLISHED",
      isPaid: false,
      createdBy: activePersona.id,
      tickets: [
        {
          id: `tkt-${Date.now()}`,
          title: "General Admission",
          priceCents: 0,
          quantityAvailable: 100,
          quantitySold: 0,
        },
      ],
    });

    setEvents(demoDb.getEvents());
    setIsCreating(false);
    setNewTitle("");
    setNewVenue("");
    setNewDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Campus Events & Hackathons
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Browse campus conferences, workshops, and flagship competitions.
          </p>
        </div>

        {(activePersona.role === "ORGANIZER" || activePersona.role === "ADMIN") && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors self-start"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "Cancel" : "Host New Event"}</span>
          </button>
        )}
      </div>

      {/* Event Creator (Organizer/Admin) */}
      {isCreating && (
        <form
          onSubmit={handleCreateEvent}
          className="p-5 rounded-xl bg-[var(--surface)] border border-indigo-500/30 space-y-4"
        >
          <div className="text-xs font-semibold text-indigo-400 font-mono">
            ORGANIZER EVENT BUILDER
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Event Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Quantum Computing Seminar"
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Campus Venue</label>
              <input
                type="text"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                placeholder="e.g. Hall 402, CS Wing"
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Outline event agenda, speaker details, and prerequisites..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
          >
            Publish Event
          </button>
        </form>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-all"
          >
            <div>
              {evt.bannerUrl && (
                <img
                  src={evt.bannerUrl}
                  alt={evt.title}
                  className="w-full h-44 object-cover border-b border-[var(--border)]"
                />
              )}
              <div className="p-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">
                    {evt.status}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {evt.isPaid ? "Paid Pass" : "Free RSVP"}
                  </span>
                </div>

                <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                  {evt.title}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                  {evt.description}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{new Date(evt.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{evt.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets & CTA */}
            <div className="p-5 pt-0 border-t border-[var(--border)]/60 bg-[var(--surface-raised)]/30 mt-4">
              <div className="text-[11px] font-medium text-[var(--text-muted)] py-2">
                Available Tiers:
              </div>
              <div className="space-y-2">
                {evt.tickets?.map((tkt: any) => (
                  <div
                    key={tkt.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground)]">
                        {tkt.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {tkt.quantitySold} / {tkt.quantityAvailable} registered
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenCheckout(evt, tkt)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                    >
                      <span>{tkt.priceCents === 0 ? "Free RSVP" : `₹${tkt.priceCents / 100}`}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demo Razorpay Checkout Simulation Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!paymentSuccess ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Event Ticket Checkout
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Razorpay Gateway (Demo Simulator)
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] mb-4 space-y-1.5">
                  <div className="text-xs font-medium text-[var(--foreground)]">
                    {selectedEvent?.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Tier: {selectedTicket?.title}
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-2">
                    {selectedTicket?.priceCents === 0
                      ? "Free Pass (₹0.00)"
                      : `Total: ₹${selectedTicket?.priceCents / 100}.00 INR`}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Simulated transaction. No actual credit card or payment credentials required.
                  </span>
                </div>

                <button
                  onClick={handleCompleteDemoCheckout}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Confirm & Simulate Payment
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Registration Confirmed!
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Your event badge and ticket have been generated and logged.
                </p>
                <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] font-mono text-xs font-bold text-indigo-400">
                  Badge: {registeredBadge}
                </div>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full mt-4 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)]"
                >
                  Close & View in Payments
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
