import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventService } from "../lib/events/service";
import type { AuthUser } from "../lib/auth/types";

describe("Events Module - Integration & Role Authorization Tests", () => {
  const studentUser: AuthUser = {
    id: "a1111111-1111-4111-8111-111111111111",
    email: "student@campusos.edu",
    name: "Alex Chen",
    role: "STUDENT",
    provider: "email",
    createdAt: new Date().toISOString(),
  };

  const organizerUser: AuthUser = {
    id: "b1111111-1111-4111-8111-111111111111",
    email: "organizer@campusos.edu",
    name: "Sarah Jenkins",
    role: "ORGANIZER",
    provider: "email",
    createdAt: new Date().toISOString(),
  };

  const adminUser: AuthUser = {
    id: "c1111111-1111-4111-8111-111111111111",
    email: "admin@campusos.edu",
    name: "Dr. Marcus Vance",
    role: "ADMIN",
    provider: "email",
    createdAt: new Date().toISOString(),
  };

  it("should prevent a STUDENT from creating an event", async () => {
    await assert.rejects(
      async () => {
        await EventService.createEvent(
          {
            title: "Student Unauthorized Party",
            venue: "Dorm 4",
            startTime: "2026-11-01T10:00:00Z",
            endTime: "2026-11-01T14:00:00Z",
            maxCapacity: 50,
            isPaid: false,
          },
          studentUser
        );
      },
      { message: /Forbidden: Only organizers and administrators can create events/ }
    );
  });

  it("should allow an ORGANIZER to create and publish an event", async () => {
    const event = await EventService.createEvent(
      {
        title: "Autonomous Drone Flight Challenge",
        slug: "drone-flight-challenge",
        venue: "Aero Flight Quad",
        startTime: "2026-11-15T09:00:00Z",
        endTime: "2026-11-15T16:00:00Z",
        maxCapacity: 100,
        isPaid: true,
        status: "DRAFT",
        tickets: [
          {
            title: "Racer Pass",
            priceCents: 29900,
            currency: "INR",
            quantityAvailable: 50,
          },
        ],
      },
      organizerUser
    );

    assert.ok(event.id);
    assert.equal(event.status, "DRAFT");

    // Publish
    const published = await EventService.setStatus(event.id, "PUBLISHED", organizerUser);
    assert.equal(published.status, "PUBLISHED");
  });

  it("should allow a STUDENT to register for a published event and capture mock payment", async () => {
    const event = await EventService.getEvent("open-source-summit-2026");
    assert.ok(event);
    assert.ok(event.tickets.length > 0);

    const ticket = event.tickets[0];

    const studentLiam: AuthUser = {
      id: "a2222222-2222-4222-8222-222222222222",
      email: "liam.student@campusos.edu",
      name: "Liam Patel",
      role: "STUDENT",
      provider: "email",
      createdAt: new Date().toISOString(),
    };

    // Check existing registration or register
    try {
      const reg = await EventService.register(event.id, ticket.id, studentLiam);
      assert.ok(reg.id);
      assert.ok(reg.registrationNumber);
      assert.equal(reg.status, "CONFIRMED");
    } catch (err: any) {
      // Liam was already registered in initial seed for open-source summit
      assert.match(err.message, /already registered/);
    }
  });

  it("should allow ORGANIZER to view participants and check in an attendee", async () => {
    const event = await EventService.getEvent("robocamp-drone-showcase");
    assert.ok(event);

    const participants = await EventService.getParticipants(event.id, organizerUser);
    assert.ok(Array.isArray(participants));
    assert.ok(participants.length > 0);

    const targetParticipant = participants[0];
    const initialCheckIn = targetParticipant.checkInTime;

    const checked = await EventService.checkInParticipant(targetParticipant.id!, organizerUser);
    assert.notEqual(checked.checkInTime, initialCheckIn);
  });

  it("should allow ADMIN to inspect global registrations and deactivate an event", async () => {
    const globalRegs = await EventService.getGlobalRegistrations(adminUser);
    assert.ok(globalRegs.length >= 3);

    // Verify mock payments are present on registrations
    const paidReg = globalRegs.find((r: any) => r.payment != null);
    assert.ok(paidReg, "Must have at least one registration with mock payment record");
    assert.equal(paidReg.payment?.status, "CAPTURED");

    // Admin deactivates an event
    const eventToDeactivate = await EventService.createEvent(
      {
        title: "Cancelled Seminar",
        venue: "Hall B",
        startTime: "2026-11-20T10:00:00Z",
        endTime: "2026-11-20T12:00:00Z",
        maxCapacity: 20,
        isPaid: false,
      },
      adminUser
    );

    const result = await EventService.deleteEvent(eventToDeactivate.id, adminUser);
    assert.equal(result, true);
  });
});
