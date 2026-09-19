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
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardFooter,
  Modal,
  Input,
} from "@campusos/ui";

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

    demoDb.createEvent({
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
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Campus Events & Hackathons
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Browse campus conferences, workshops, and flagship competitions.
          </p>
        </div>

        {(activePersona.role === "ORGANIZER" || activePersona.role === "ADMIN") && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreating(!isCreating)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isCreating ? "Cancel" : "Host New Event"}
          </Button>
        )}
      </div>

      {/* Event Creator (Organizer/Admin) */}
      {isCreating && (
        <Card variant="highlight">
          <CardContent>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="text-[11px] font-semibold text-[var(--brand-indigo)] font-mono tracking-wider uppercase">
                Organizer Event Builder
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Event Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Quantum Computing Seminar"
                  required
                />
                <Input
                  label="Campus Venue"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. Hall 402, CS Wing"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Outline event agenda, speaker details, and prerequisites..."
                  rows={3}
                  className="w-full rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-3 focus:outline-none focus:border-[var(--brand-indigo)] focus-visible:ring-1 focus-visible:ring-[var(--brand-indigo)] transition-all duration-150"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Discard
                </Button>
                <Button type="submit" size="sm" variant="primary">
                  Publish Event
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <Card
            key={evt.id}
            variant="default"
            className="overflow-hidden flex flex-col justify-between hover:border-[var(--border-interactive)] transition-all"
          >
            <div>
              {evt.bannerUrl && (
                <img
                  src={evt.bannerUrl}
                  alt={evt.title}
                  className="w-full h-44 object-cover border-b border-[var(--border-subtle)]"
                />
              )}
              <div className="p-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <Badge variant="brand" size="sm">
                    {evt.status}
                  </Badge>
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                    <Tag className="w-3 h-3" />
                    {evt.isPaid ? "Paid Pass" : "Free RSVP"}
                  </span>
                </div>

                <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                  {evt.title}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                  {evt.description}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--brand-indigo)]" />
                    <span>
                      {new Date(evt.startTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--brand-indigo)]" />
                    <span>{evt.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets & CTA */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]">
              <div className="text-[11px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                Available Tiers
              </div>
              <div className="space-y-2">
                {evt.tickets?.map((tkt: any) => (
                  <div
                    key={tkt.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {tkt.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {tkt.quantitySold} / {tkt.quantityAvailable} registered
                      </div>
                    </div>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleOpenCheckout(evt, tkt)}
                      rightIcon={<ArrowRight className="w-3 h-3" />}
                    >
                      {tkt.priceCents === 0 ? "Free RSVP" : `₹${tkt.priceCents / 100}`}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={paymentSuccess ? "Registration Confirmed" : "Event Ticket Checkout"}
        description={
          paymentSuccess
            ? "Your event badge and ticket have been generated and logged."
            : "Razorpay Gateway Demo Simulator"
        }
      >
        {!paymentSuccess ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                  {selectedEvent?.title}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Tier: {selectedTicket?.title}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] space-y-1">
              <div className="text-xs text-[var(--text-secondary)]">Payment Amount</div>
              <div className="text-xl font-bold font-mono text-[var(--status-success)]">
                {selectedTicket?.priceCents === 0
                  ? "Free Pass (₹0.00)"
                  : `Total: ₹${selectedTicket?.priceCents / 100}.00 INR`}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--status-warning-surface)] border border-[var(--status-warning-border)] text-[11px] text-[var(--status-warning)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Simulated transaction. No actual credit card or payment credentials required.
              </span>
            </div>

            <Button
              variant="success"
              className="w-full"
              size="md"
              onClick={handleCompleteDemoCheckout}
            >
              Confirm & Simulate Payment
            </Button>
          </div>
        ) : (
          <div className="text-center py-3 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--status-success-surface)] text-[var(--status-success)] border border-[var(--status-success-border)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">Generated Registration Badge</div>
              <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-[var(--brand-indigo)] mt-1.5">
                {registeredBadge}
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              size="md"
              onClick={() => setCheckoutModalOpen(false)}
            >
              Close & View in Payments
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
