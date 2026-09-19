"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "../AppContext";
import {
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Ticket,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Users,
  BarChart3,
  Edit3,
  Trash2,
  QrCode,
  Clock,
  Eye,
  DollarSign,
  AlertCircle,
  X,
  Check,
  Building,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardFooter,
  Modal,
  Input,
  StatCard,
} from "@campusos/ui";

export function EventsView() {
  const { activePersona } = useApp();

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<"ALL" | "FREE" | "PAID">("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Active Modals & Selected Objects
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [registering, setRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  // Organizer Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [ticketsModalOpen, setTicketsModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  // Admin Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);

  // Sub-data states
  const [participants, setParticipants] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [participantSearch, setParticipantSearch] = useState("");

  // Create/Edit Form State
  const [formTitle, setFormTitle] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Technology & Coding");
  const [formStartTime, setFormStartTime] = useState("2026-11-10T10:00");
  const [formEndTime, setFormEndTime] = useState("2026-11-10T18:00");
  const [formMaxCapacity, setFormMaxCapacity] = useState(150);
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formTicketPrice, setFormTicketPrice] = useState(499);
  const [formTicketTitle, setFormTicketTitle] = useState("General Admission Pass");

  // New Ticket Form
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketPrice, setNewTicketPrice] = useState(0);
  const [newTicketQty, setNewTicketQty] = useState(50);
  const [newTicketDesc, setNewTicketDesc] = useState("");

  const isOrganizerOrAdmin = activePersona.role === "ORGANIZER" || activePersona.role === "ADMIN";
  const isAdmin = activePersona.role === "ADMIN";

  // Fetch events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedStatusFilter !== "ALL") params.set("status", selectedStatusFilter);
      if (selectedPriceFilter === "FREE") params.set("isPaid", "false");
      if (selectedPriceFilter === "PAID") params.set("isPaid", "true");

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatusFilter, selectedPriceFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Open Details Modal
  const handleOpenDetails = (event: any) => {
    setSelectedEvent(event);
    setRegistrationResult(event.userRegistration || null);
    if (event.tickets && event.tickets.length > 0) {
      setSelectedTicketId(event.tickets[0].id);
    }
    setDetailsModalOpen(true);
  };

  // Student Registration Action
  const handleRegister = async () => {
    if (!selectedEvent || !selectedTicketId) return;
    try {
      setRegistering(true);
      const res = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicketId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrationResult(data.data);
        loadEvents();
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setRegistering(false);
    }
  };

  // Toggle Publish / Unpublish
  const handleTogglePublish = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin / Organizer: Deactivate Event
  const handleDeleteEvent = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to deactivate event "${event.title}"?`)) return;
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (res.ok) {
        loadEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormVenue(event.venue);
    setFormDesc(event.description || "");
    setFormMaxCapacity(event.maxCapacity || 100);
    setFormIsPaid(Boolean(event.isPaid));
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          venue: formVenue,
          description: formDesc,
          maxCapacity: Number(formMaxCapacity),
          isPaid: formIsPaid,
        }),
      });
      if (res.ok) {
        setEditModalOpen(false);
        loadEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Create Event
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          venue: formVenue,
          description: formDesc,
          startTime: new Date(formStartTime).toISOString(),
          endTime: new Date(formEndTime).toISOString(),
          maxCapacity: Number(formMaxCapacity),
          isPaid: formIsPaid,
          status: "PUBLISHED",
          tickets: [
            {
              title: formTicketTitle,
              priceCents: formIsPaid ? formTicketPrice * 100 : 0,
              currency: "INR",
              quantityAvailable: Number(formMaxCapacity),
            },
          ],
        }),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setFormTitle("");
        setFormVenue("");
        setFormDesc("");
        loadEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Participant Roster
  const handleOpenParticipants = async (event: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEvent(event);
    setParticipantsModalOpen(true);
    try {
      const res = await fetch(`/api/events/${event.id}/participants`);
      if (res.ok) {
        const json = await res.json();
        setParticipants(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Check In
  const handleCheckIn = async (registrationId: string) => {
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setParticipants((prev) =>
          prev.map((p) => (p.id === registrationId ? { ...p, checkInTime: updated.data.checkInTime } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Analytics Modal
  const handleOpenAnalytics = async (event: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEvent(event);
    setAnalyticsModalOpen(true);
    try {
      const res = await fetch(`/api/events/${event.id}/analytics`);
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Open Inspect Global Registrations
  const handleOpenInspectRegistrations = async () => {
    setInspectModalOpen(true);
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) {
        const json = await res.json();
        setAllRegistrations(json.data.registrations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    if (!participantSearch) return participants;
    const q = participantSearch.toLowerCase();
    return participants.filter(
      (p) =>
        p.user?.profile?.fullName?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.registrationNumber?.toLowerCase().includes(q)
    );
  }, [participants, participantSearch]);

  const categories = ["ALL", "Technology & Coding", "Hardware & AI", "Creative Arts & UI/UX"];

  return (
    <div className="space-y-6">
      {/* Top Banner & Persona Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Campus Events & Hackathons
            </h1>
            <Badge variant="brand" size="sm">
              Live Hub
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Browse flagship symposiums, competitive coding hackathons, robotics obstacle showcases, and design jams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenInspectRegistrations}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
            >
              Inspect Registrations
            </Button>
          )}

          {isOrganizerOrAdmin && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Host New Event
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, description, venue, or host club..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-indigo)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[var(--brand-indigo)] text-white"
                  : "bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Price & Status Filters */}
        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-[var(--border-subtle)] pt-2 md:pt-0 md:pl-3">
          <select
            value={selectedPriceFilter}
            onChange={(e: any) => setSelectedPriceFilter(e.target.value)}
            className="text-xs bg-[var(--canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[var(--brand-indigo)]"
          >
            <option value="ALL">All Pricing</option>
            <option value="FREE">Free RSVP</option>
            <option value="PAID">Paid Pass</option>
          </select>

          {isOrganizerOrAdmin && (
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs bg-[var(--canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[var(--brand-indigo)]"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
            </select>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] animate-pulse">
          Loading campus events...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-8">
          <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">No events match your criteria</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            Try adjusting your search query or reset the category filters to discover upcoming events.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedPriceFilter("ALL");
              setSelectedStatusFilter("ALL");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => {
            const isRegistered = Boolean(evt.userRegistration);
            const isDraft = evt.status === "DRAFT";
            const percentFilled = evt.maxCapacity > 0
              ? Math.min(100, Math.round((evt.registrationCount / evt.maxCapacity) * 100))
              : 0;

            return (
              <Card
                key={evt.id}
                variant="default"
                className="overflow-hidden flex flex-col justify-between hover:border-[var(--border-interactive)] transition-all group"
              >
                <div>
                  {/* Banner Image with Overlays */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                    <img
                      src={
                        evt.bannerUrl ||
                        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800"
                      }
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={isDraft ? "warning" : "brand"}
                          size="sm"
                        >
                          {evt.status}
                        </Badge>
                        {evt.isPaid ? (
                          <Badge variant="neutral" size="sm">
                            Paid Pass
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Free RSVP
                          </Badge>
                        )}
                      </div>

                      {isRegistered && (
                        <Badge variant="success" size="sm" className="flex items-center gap-1 bg-emerald-500/90 text-white">
                          <CheckCircle2 className="w-3 h-3" /> Registered
                        </Badge>
                      )}
                    </div>

                    {/* Host Organization Info */}
                    {evt.organization && (
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-2 text-white">
                        {evt.organization.logoUrl && (
                          <img
                            src={evt.organization.logoUrl}
                            alt={evt.organization.name}
                            className="w-5 h-5 rounded-full border border-white/20"
                          />
                        )}
                        <span className="text-[11px] font-medium tracking-tight drop-shadow">
                          {evt.organization.name}
                        </span>
                        {evt.organization.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight line-clamp-1">
                      {evt.title}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-[var(--text-secondary)] pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[var(--brand-indigo)] flex-shrink-0" />
                        <span className="font-medium">
                          {new Date(evt.startTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          •{" "}
                          {new Date(evt.startTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[var(--brand-indigo)] flex-shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-medium">
                        <span>Capacity: {evt.registrationCount} / {evt.maxCapacity}</span>
                        <span>{percentFilled}% Filled</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentFilled > 90 ? "bg-red-500" : percentFilled > 60 ? "bg-amber-500" : "bg-[var(--brand-indigo)]"
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3.5 bg-[var(--surface-raised)] border-t border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {evt.isPaid ? (
                        evt.tickets && evt.tickets[0] ? (
                          `₹${(evt.tickets[0].priceCents / 100).toFixed(0)} onwards`
                        ) : (
                          "Paid"
                        )
                      ) : (
                        "Free Entry"
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant={isRegistered ? "outline" : "primary"}
                      onClick={() => handleOpenDetails(evt)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isRegistered ? "View Pass" : "Register"}
                    </Button>
                  </div>

                  {/* Organizer/Admin Inline Management Bar */}
                  {isOrganizerOrAdmin && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => handleTogglePublish(evt, e)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                          isDraft
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        {isDraft ? "Publish" : "Unpublish"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleOpenParticipants(evt, e)}
                          title="View Attendees"
                          className="p-1 hover:text-[var(--brand-indigo)] transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenAnalytics(evt, e)}
                          title="Event Analytics"
                          className="p-1 hover:text-[var(--brand-indigo)] transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEdit(evt, e)}
                          title="Edit Event"
                          className="p-1 hover:text-[var(--brand-indigo)] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteEvent(evt, e)}
                          title="Deactivate Event"
                          className="p-1 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. STUDENT EVENT DETAILS & TICKET SELECTION MODAL */}
      {/* ========================================================================= */}
      {detailsModalOpen && selectedEvent && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedEvent.title}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Banner & Host Club Header */}
            <div className="relative h-48 rounded-xl overflow-hidden bg-slate-900 border border-[var(--border-subtle)]">
              <img
                src={
                  selectedEvent.bannerUrl ||
                  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800"
                }
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <div className="text-xs text-indigo-300 font-mono">
                    {selectedEvent.organization?.name || "CampusOS Official"}
                  </div>
                  <div className="text-sm font-bold">{selectedEvent.title}</div>
                </div>
                <Badge variant={selectedEvent.isPaid ? "warning" : "success"}>
                  {selectedEvent.isPaid ? "Paid Pass" : "Free RSVP"}
                </Badge>
              </div>
            </div>

            {/* Event Logistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[var(--brand-indigo)]" />
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Date & Schedule
                  </div>
                  <div className="text-[var(--text-primary)] font-medium">
                    {new Date(selectedEvent.startTime).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--brand-indigo)]" />
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Campus Venue
                  </div>
                  <div className="text-[var(--text-primary)] font-medium">
                    {selectedEvent.venue}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                About the Event
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {selectedEvent.description || "No description provided for this campus event."}
              </p>
            </div>

            {/* REGISTRATION STATUS PASS (If already registered) */}
            {registrationResult ? (
              <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Official Registration Verified</span>
                  </div>
                  <Badge variant="success" size="sm">
                    {registrationResult.status || "CONFIRMED"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/30 rounded-lg border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">
                      Registration Number
                    </span>
                    <div className="text-sm font-mono font-bold text-emerald-300">
                      {registrationResult.registrationNumber}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">
                      Attendee Name
                    </span>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {activePersona.name} ({activePersona.studentId || "Student"})
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Show this digital badge at venue entrance for check-in</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70">Pass Active</span>
                </div>
              </div>
            ) : (
              /* TICKET SELECTION SECTION */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[var(--brand-indigo)]" />
                    Select Ticket Tier
                  </h4>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {selectedEvent.tickets?.length || 0} tier(s) available
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedEvent.tickets?.map((tkt: any) => {
                    const isSelected = selectedTicketId === tkt.id;
                    const isSoldOut = tkt.quantityAvailable > 0 && tkt.quantitySold >= tkt.quantityAvailable;

                    return (
                      <div
                        key={tkt.id}
                        onClick={() => !isSoldOut && setSelectedTicketId(tkt.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-[var(--surface-raised)] border-[var(--brand-indigo)] shadow-sm"
                            : isSoldOut
                            ? "opacity-50 cursor-not-allowed bg-[var(--surface)] border-[var(--border-subtle)]"
                            : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-interactive)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[var(--brand-indigo)] bg-[var(--brand-indigo)]"
                                : "border-[var(--border-subtle)]"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                              <span>{tkt.title}</span>
                              {isSoldOut && (
                                <span className="text-[10px] text-red-400 font-mono font-medium">
                                  SOLD OUT
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {tkt.description || "Admission to event program."}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
                            {tkt.priceCents === 0 ? "Free" : `₹${(tkt.priceCents / 100).toFixed(0)}`}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {tkt.quantityAvailable - (tkt.quantitySold || 0)} left
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3">
                  <Button
                    size="md"
                    variant="primary"
                    className="w-full justify-center"
                    onClick={handleRegister}
                    disabled={registering || !selectedTicketId}
                  >
                    {registering ? "Processing Registration..." : "Confirm Ticket & Complete Registration"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 2. HOST NEW EVENT MODAL (Organizer/Admin) */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Host New Campus Event"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Event Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. AI Agents & Edge Computing Hackathon"
                required
              />
              <Input
                label="Campus Venue"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                placeholder="e.g. Alan Turing Innovation Hall"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Description & Agenda
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Describe schedule, keynote speakers, prize pools, and prerequisites..."
                rows={3}
                className="w-full rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-3 focus:outline-none focus:border-[var(--brand-indigo)]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                required
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                required
              />
              <Input
                label="Maximum Capacity"
                type="number"
                value={formMaxCapacity}
                onChange={(e) => setFormMaxCapacity(Number(e.target.value))}
                min={1}
                required
              />
            </div>

            <div className="p-3.5 bg-[var(--surface-raised)] rounded-xl border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Ticketing & Payment
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Configure initial ticket pass for participants
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={formIsPaid}
                    onChange={(e) => setFormIsPaid(e.target.checked)}
                    className="rounded text-[var(--brand-indigo)]"
                  />
                  <span>Paid Pass</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Initial Ticket Name"
                  value={formTicketTitle}
                  onChange={(e) => setFormTicketTitle(e.target.value)}
                  placeholder="e.g. Student Developer Pass"
                />
                {formIsPaid && (
                  <Input
                    label="Ticket Price (INR ₹)"
                    type="number"
                    value={formTicketPrice}
                    onChange={(e) => setFormTicketPrice(Number(e.target.value))}
                    min={1}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button type="button" size="sm" variant="ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Create & Publish Event
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT EVENT MODAL */}
      {/* ========================================================================= */}
      {editModalOpen && selectedEvent && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Event: ${selectedEvent.title}`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <Input
              label="Event Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
            <Input
              label="Venue"
              value={formVenue}
              onChange={(e) => setFormVenue(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] p-3 focus:outline-none focus:border-[var(--brand-indigo)]"
              />
            </div>
            <Input
              label="Max Capacity"
              type="number"
              value={formMaxCapacity}
              onChange={(e) => setFormMaxCapacity(Number(e.target.value))}
              required
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 4. PARTICIPANT LIST ROSTER MODAL (Organizer/Admin) */}
      {/* ========================================================================= */}
      {participantsModalOpen && selectedEvent && (
        <Modal
          isOpen={participantsModalOpen}
          onClose={() => setParticipantsModalOpen(false)}
          title={`Participant Roster: ${selectedEvent.title}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search attendee by name, email, or pass #..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Total: <span className="font-semibold text-[var(--text-primary)]">{filteredParticipants.length}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                    <th className="p-3 font-semibold">Attendee</th>
                    <th className="p-3 font-semibold">Registration #</th>
                    <th className="p-3 font-semibold">Ticket Tier</th>
                    <th className="p-3 font-semibold">Payment Status</th>
                    <th className="p-3 font-semibold">Check-in Status</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[var(--text-muted)]">
                        No registered attendees found for this event.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((part) => {
                      const isCheckedIn = Boolean(part.checkInTime);

                      return (
                        <tr key={part.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="p-3">
                            <div className="font-medium text-[var(--text-primary)]">
                              {part.user?.profile?.fullName || part.user?.email || "Student"}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {part.user?.email} • {part.user?.profile?.studentId || "CS-2026"}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-medium text-[var(--brand-indigo)]">
                            {part.registrationNumber}
                          </td>
                          <td className="p-3">
                            <Badge variant="neutral" size="sm">
                              {part.ticket?.title || "General Pass"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={part.payment?.status === "CAPTURED" ? "success" : "neutral"} size="sm">
                              {part.payment?.status || (selectedEvent.isPaid ? "CAPTURED" : "FREE")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {isCheckedIn ? (
                              <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                              </span>
                            ) : (
                              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                                Pending Arrival
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant={isCheckedIn ? "outline" : "primary"}
                              onClick={() => handleCheckIn(part.id)}
                            >
                              {isCheckedIn ? "Undo" : "Check In"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 5. EVENT ANALYTICS MODAL (Organizer/Admin) */}
      {/* ========================================================================= */}
      {analyticsModalOpen && selectedEvent && analyticsData && (
        <Modal
          isOpen={analyticsModalOpen}
          onClose={() => setAnalyticsModalOpen(false)}
          title={`Analytics: ${selectedEvent.title}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* StatCards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Registrations"
                value={analyticsData.totalRegistrations}
                subtitle={`Cap: ${analyticsData.maxCapacity}`}
              />
              <StatCard
                title="Capacity"
                value={`${analyticsData.capacityUtilization}%`}
                subtitle="Hall occupancy"
              />
              <StatCard
                title="Checked-In"
                value={analyticsData.checkedInCount}
                subtitle={`${analyticsData.checkInRate}% rate`}
              />
              <StatCard
                title="Gross Revenue"
                value={`₹${(analyticsData.grossRevenueCents / 100).toFixed(0)}`}
                subtitle="Direct pass volume"
              />
            </div>

            {/* Tickets Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Ticket Tier Performance
              </h4>
              <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                      <th className="p-3">Tier Name</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Sold / Available</th>
                      <th className="p-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {analyticsData.ticketsBreakdown?.map((tier: any) => (
                      <tr key={tier.id}>
                        <td className="p-3 font-medium text-[var(--text-primary)]">{tier.title}</td>
                        <td className="p-3 font-mono">
                          {tier.priceCents === 0 ? "Free" : `₹${(tier.priceCents / 100).toFixed(0)}`}
                        </td>
                        <td className="p-3">
                          {tier.quantitySold} / {tier.quantityAvailable}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-400">
                          ₹{(tier.revenueCents / 100).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. ADMIN GLOBAL REGISTRATIONS INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {inspectModalOpen && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title="Campus Admin: Global Registrations Inspector"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--brand-indigo)]" />
              <span>Full audit inspection of all registered student tickets and mock captured payments across CampusOS.</span>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[var(--surface-raised)]">
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                    <th className="p-3 font-semibold">Pass #</th>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Event</th>
                    <th className="p-3 font-semibold">Payment Status</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {allRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-[var(--surface-hover)]">
                      <td className="p-3 font-mono text-[var(--brand-indigo)] font-medium">
                        {reg.registrationNumber}
                      </td>
                      <td className="p-3 font-medium text-[var(--text-primary)]">
                        {reg.user?.profile?.fullName || reg.user?.email || "Student"}
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        {reg.event?.title || "Campus Event"}
                      </td>
                      <td className="p-3">
                        <Badge variant={reg.payment?.status === "CAPTURED" ? "success" : "neutral"} size="sm">
                          {reg.payment?.status || "CAPTURED"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="brand" size="sm">
                          {reg.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
