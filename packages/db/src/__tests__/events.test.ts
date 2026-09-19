import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { demoDb } from "../repository";

describe("Events Module - Unit & Domain Tests", () => {
  const studentId = "a1111111-1111-4111-8111-111111111111"; // Alex Chen
  const organizerId = "b2222222-2222-4222-8222-222222222222"; // David Kim
  const adminId = "c1111111-1111-4111-8111-111111111111"; // Dr. Marcus Vance

  it("should browse events and apply search query", () => {
    const all = demoDb.getEvents();
    assert.ok(all.length >= 6, "Should have at least 6 initial seed events");

    const hackathonResults = demoDb.getEvents({ query: "CampusHack" });
    assert.equal(hackathonResults.length, 1);
    assert.match(hackathonResults[0].title, /CampusHack/i);

    const nonExistent = demoDb.getEvents({ query: "NonExistentConference123" });
    assert.equal(nonExistent.length, 0);
  });

  it("should filter events by category, status, and pricing", () => {
    const techEvents = demoDb.getEvents({ category: "Technology" });
    assert.ok(techEvents.length > 0, "Should find Technology events");
    assert.ok(techEvents.every((e: any) => e.organization?.category?.includes("Technology")));

    const freeEvents = demoDb.getEvents({ isPaid: false });
    assert.ok(freeEvents.length > 0);
    assert.ok(freeEvents.every((e: any) => !e.isPaid));

    const paidEvents = demoDb.getEvents({ isPaid: true });
    assert.ok(paidEvents.length > 0);
    assert.ok(paidEvents.every((e: any) => e.isPaid));
  });

  it("should get event by slug and by id with organization and tickets enriched", () => {
    const event = demoDb.getEventBySlug("campushack-2026");
    assert.ok(event, "Should find CampusHack 2026 by slug");
    assert.equal(event.slug, "campushack-2026");
    assert.ok(event.organization, "Event must have organization enriched");
    assert.equal(event.organization.name, "ACM Student Chapter");
    assert.ok(Array.isArray(event.tickets) && event.tickets.length > 0, "Must have tickets array");

    const byId = demoDb.getEventById(event.id);
    assert.ok(byId);
    assert.equal(byId.id, event.id);
  });

  it("should create, update, and publish an event", () => {
    const created = demoDb.createEvent({
      title: "Edge AI Summer Bootcamp",
      slug: "edge-ai-summer-bootcamp",
      venue: "CS Turing Lab 201",
      description: "Intensive 3-day deep dive into ONNX runtime and microcontrollers.",
      startTime: "2026-12-01T09:00:00Z",
      endTime: "2026-12-03T18:00:00Z",
      maxCapacity: 60,
      isPaid: false,
      status: "DRAFT",
      createdBy: organizerId,
    });

    assert.ok(created.id);
    assert.equal(created.status, "DRAFT");
    assert.equal(created.maxCapacity, 60);

    // Update event
    const updated = demoDb.updateEvent(created.id, {
      venue: "Grand Auditorium West",
      maxCapacity: 75,
    }, organizerId);
    assert.equal(updated.venue, "Grand Auditorium West");
    assert.equal(updated.maxCapacity, 75);

    // Publish event
    const published = demoDb.setEventStatus(created.id, "PUBLISHED", organizerId);
    assert.equal(published.status, "PUBLISHED");
  });

  it("should configure tickets for an event", () => {
    const event = demoDb.getEventBySlug("robocamp-drone-showcase");
    assert.ok(event);

    // Add new ticket tier
    const newTier = demoDb.createTicket(event.id, {
      title: "VIP Drone Pilot Workshop",
      description: "Includes hands-on drone transmitter kit.",
      priceCents: 129900,
      currency: "INR",
      quantityAvailable: 20,
    });
    assert.ok(newTier.id);
    assert.equal(newTier.title, "VIP Drone Pilot Workshop");
    assert.equal(newTier.priceCents, 129900);

    // Update ticket tier
    const updatedTier = demoDb.updateTicket(event.id, newTier.id, {
      priceCents: 99900,
      quantityAvailable: 25,
    });
    assert.equal(updatedTier.priceCents, 99900);
    assert.equal(updatedTier.quantityAvailable, 25);
  });

  it("should successfully register a student for an event and prevent duplicates", () => {
    const event = demoDb.getEventBySlug("quantum-computing-seminar");
    assert.ok(event);
    const ticket = event.tickets[0];
    assert.ok(ticket);

    const studentMayaId = "a3333333-3333-4333-8333-333333333333";

    // Initial ticket quantity sold
    const initialSold = ticket.quantitySold || 0;

    // Register
    const reg = demoDb.registerForEvent({
      eventId: event.id,
      ticketId: ticket.id,
      userId: studentMayaId,
      userEmail: "maya.student@campusos.edu",
    });

    assert.ok(reg.id);
    assert.ok(reg.registrationNumber.startsWith("CAMPUS-"));
    assert.equal(reg.status, "CONFIRMED");
    assert.equal(ticket.quantitySold, initialSold + 1);

    // Duplicate registration attempt must fail
    assert.throws(
      () => {
        demoDb.registerForEvent({
          eventId: event.id,
          ticketId: ticket.id,
          userId: studentMayaId,
        });
      },
      { message: "You are already registered for this event." }
    );
  });

  it("should reject registration when ticket tier is sold out", () => {
    const event = demoDb.createEvent({
      title: "Exclusive Closed Keynote",
      venue: "Executive Boardroom",
      maxCapacity: 1,
      status: "PUBLISHED",
      createdBy: organizerId,
      tickets: [
        {
          id: "tkt-sold-out-test",
          title: "Single Seat Ticket",
          priceCents: 0,
          quantityAvailable: 1,
          quantitySold: 1, // Already sold out!
        },
      ],
    });

    assert.throws(
      () => {
        demoDb.registerForEvent({
          eventId: event.id,
          ticketId: "tkt-sold-out-test",
          userId: "a2222222-2222-4222-8222-222222222222",
        });
      },
      { message: "This ticket tier is sold out." }
    );
  });

  it("should check-in a registered participant", () => {
    const regs = demoDb.getRegistrations();
    assert.ok(regs.length > 0);
    const targetReg = regs[0];

    const initialCheckIn = targetReg.checkInTime;

    // Check in
    const checked = demoDb.checkInParticipant(targetReg.id!);
    assert.notEqual(checked.checkInTime, initialCheckIn);
  });

  it("should generate accurate organizer event analytics", () => {
    const event = demoDb.getEventBySlug("campushack-2026");
    assert.ok(event);

    const analytics = demoDb.getEventAnalytics(event.id);
    assert.equal(analytics.eventId, event.id);
    assert.ok(analytics.maxCapacity >= 250);
    assert.ok(analytics.totalRegistrations >= 1);
    assert.ok(analytics.capacityUtilization > 0);
    assert.ok(Array.isArray(analytics.ticketsBreakdown));
    assert.ok(analytics.grossRevenueCents >= 0);
  });

  it("should allow admin to deactivate an event and inspect global registrations", () => {
    // Create temporary event for deletion
    const tempEvent = demoDb.createEvent({
      title: "Temp Event to Deactivate",
      venue: "Room 101",
      createdBy: organizerId,
    });

    const deleted = demoDb.deleteEvent(tempEvent.id, adminId);
    assert.equal(deleted, true);

    const fetched = demoDb.getEventById(tempEvent.id);
    assert.equal(fetched, undefined);

    // Global analytics
    const globalStats = demoDb.getGlobalEventsAnalytics();
    assert.ok(globalStats.totalEvents > 0);
    assert.ok(globalStats.totalRegistrations > 0);
  });
});
