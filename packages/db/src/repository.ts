import { demoData } from "./seeds/demo-data";
import type {
  Task,
  AttendanceRecord,
  Resource,
  UserProfile,
  UserRole,
  EventRegistration,
  AuditLog,
} from "@campusos/core";

export interface CampusUser {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  orderId: string;
  paymentId?: string;
  amountCents: number;
  amount: number;
  currency: string;
  status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";
  eventTitle?: string;
  ticketTitle?: string;
  eventId?: string;
  ticketId?: string;
  registrationId?: string;
  signature?: string;
  idempotencyKey?: string;
  errorCode?: string;
  errorDescription?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface GoogleConnectionRecord {
  id: string;
  userId: string;
  googleUserId: string;
  email: string;
  encryptedRefreshToken: string;
  scope: string;
  tokenExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventRecord {
  id: string;
  userId: string;
  googleEventId?: string;
  eventId?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipRecord {
  organizationId: string;
  userId: string;
  role: "MEMBER" | "OFFICER" | "LEAD";
}

export interface EnrichedRegistration extends EventRegistration {
  user?: CampusUser;
  ticket?: any;
  event?: any;
  payment?: PaymentRecord;
}

class DemoRepository {
  private users: CampusUser[] = [...(demoData.users as CampusUser[])];
  private events: any[] = JSON.parse(JSON.stringify(demoData.events));
  private tasks: any[] = JSON.parse(JSON.stringify(demoData.tasks));
  private attendance: any[] = JSON.parse(JSON.stringify(demoData.attendance));
  private resources: any[] = JSON.parse(JSON.stringify(demoData.resources));
  private organizations: any[] = JSON.parse(JSON.stringify(demoData.organizations));
  private memberships: MembershipRecord[] = JSON.parse(JSON.stringify(demoData.memberships));
  private registrations: any[] = JSON.parse(JSON.stringify(demoData.registrations));
  private payments: PaymentRecord[] = JSON.parse(JSON.stringify(demoData.payments));
  private notifications: NotificationRecord[] = JSON.parse(JSON.stringify(demoData.notifications));
  private auditLogs: AuditLog[] = JSON.parse(JSON.stringify(demoData.auditLogs));
  private processedWebhooks: Set<string> = new Set<string>();
  private googleConnections: GoogleConnectionRecord[] = [];
  private calendarEvents: CalendarEventRecord[] = [];

  // User queries
  getUsers(): CampusUser[] {
    return this.users;
  }

  getUserById(id: string): CampusUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): CampusUser | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // Events
  getEvents(filters?: {
    query?: string;
    category?: string;
    organizationId?: string;
    status?: string;
    isPaid?: boolean;
    userId?: string;
  }): any[] {
    let list = this.events.map((e) => this.enrichEvent(e, filters?.userId));

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.venue.toLowerCase().includes(q) ||
          (e.organization && e.organization.name.toLowerCase().includes(q))
      );
    }

    if (filters?.organizationId) {
      list = list.filter((e) => e.organizationId === filters.organizationId);
    }

    if (filters?.category && filters.category !== "ALL") {
      const cat = filters.category.toLowerCase();
      list = list.filter(
        (e) => e.organization && e.organization.category && e.organization.category.toLowerCase().includes(cat)
      );
    }

    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((e) => e.status === filters.status);
    }

    if (filters?.isPaid !== undefined) {
      list = list.filter((e) => Boolean(e.isPaid) === filters.isPaid);
    }

    return list;
  }

  getEventById(id: string, currentUserId?: string): any | undefined {
    const event = this.events.find((e) => e.id === id);
    if (!event) return undefined;
    return this.enrichEvent(event, currentUserId);
  }

  getEventBySlug(slug: string, currentUserId?: string): any | undefined {
    const event = this.events.find((e) => e.slug === slug);
    if (!event) return undefined;
    return this.enrichEvent(event, currentUserId);
  }

  private enrichEvent(event: any, currentUserId?: string): any {
    const org = this.organizations.find((o) => o.id === event.organizationId);
    const regs = this.registrations.filter((r) => r.eventId === event.id && r.status !== "CANCELLED");
    const userReg = currentUserId
      ? this.registrations.find((r) => r.eventId === event.id && r.userId === currentUserId && r.status !== "CANCELLED")
      : undefined;

    return {
      ...event,
      organization: org,
      registrationCount: regs.length,
      userRegistration: userReg,
      tickets: event.tickets || [],
    };
  }

  createEvent(eventData: any): any {
    const id = eventData.id || `e-${Date.now()}`;
    const slug =
      eventData.slug ||
      eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newEvent = {
      ...eventData,
      id,
      slug,
      status: eventData.status || "DRAFT",
      maxCapacity: eventData.maxCapacity || 100,
      isPaid: Boolean(eventData.isPaid),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tickets: eventData.tickets && eventData.tickets.length > 0 ? eventData.tickets : [
        {
          id: `t-${Date.now()}-1`,
          eventId: id,
          title: eventData.isPaid ? "General Admission" : "Free RSVP",
          description: "Full access to all scheduled sessions.",
          priceCents: eventData.isPaid ? 49900 : 0,
          currency: "INR",
          quantityAvailable: eventData.maxCapacity || 100,
          quantitySold: 0,
          salesEnd: eventData.endTime,
        },
      ],
    };

    this.events.unshift(newEvent);

    this.logAudit({
      actorId: eventData.createdBy || "b2222222-2222-4222-8222-222222222222",
      action: "EVENT_CREATED",
      resourceType: "event",
      resourceId: newEvent.id,
      changes: { title: newEvent.title, venue: newEvent.venue, status: newEvent.status },
    });

    return this.enrichEvent(newEvent);
  }

  updateEvent(id: string, updates: any, actorId?: string): any {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Event with ID ${id} not found`);
    }

    const current = this.events[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.events[index] = updated;

    this.logAudit({
      actorId: actorId || current.createdBy || "b2222222-2222-4222-8222-222222222222",
      action: "EVENT_UPDATED",
      resourceType: "event",
      resourceId: id,
      changes: updates,
    });

    return this.enrichEvent(updated);
  }

  setEventStatus(id: string, status: string, actorId?: string): any {
    return this.updateEvent(id, { status }, actorId);
  }

  deleteEvent(id: string, actorId?: string): boolean {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) return false;
    const deleted = this.events.splice(index, 1)[0];

    this.logAudit({
      actorId: actorId || "c1111111-1111-4111-8111-111111111111",
      action: "EVENT_DEACTIVATED",
      resourceType: "event",
      resourceId: id,
      changes: { title: deleted.title },
    });

    return true;
  }

  // Tickets
  createTicket(eventId: string, ticketData: any): any {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");

    const newTicket = {
      id: ticketData.id || `t-${Date.now()}`,
      eventId,
      title: ticketData.title,
      description: ticketData.description || "",
      priceCents: ticketData.priceCents || 0,
      currency: ticketData.currency || "INR",
      quantityAvailable: ticketData.quantityAvailable || 50,
      quantitySold: 0,
      salesEnd: ticketData.salesEnd || event.endTime,
    };

    if (!event.tickets) event.tickets = [];
    event.tickets.push(newTicket);
    return newTicket;
  }

  updateTicket(eventId: string, ticketId: string, updates: any): any {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
    const ticket = event.tickets?.find((t: any) => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");

    Object.assign(ticket, updates);
    return ticket;
  }

  deleteTicket(eventId: string, ticketId: string): boolean {
    const event = this.events.find((e) => e.id === eventId);
    if (!event || !event.tickets) return false;
    const index = event.tickets.findIndex((t: any) => t.id === ticketId);
    if (index === -1) return false;
    event.tickets.splice(index, 1);
    return true;
  }

  // Registrations & Mock Payments
  getRegistrations(filters?: { eventId?: string; userId?: string }): EnrichedRegistration[] {
    let list = this.registrations;
    if (filters?.eventId) {
      list = list.filter((r) => r.eventId === filters.eventId);
    }
    if (filters?.userId) {
      list = list.filter((r) => r.userId === filters.userId);
    }

    return list.map((reg) => {
      const user = this.users.find((u) => u.id === reg.userId);
      const event = this.events.find((e) => e.id === reg.eventId);
      const ticket = event?.tickets?.find((t: any) => t.id === reg.ticketId);
      const payment = this.payments.find(
        (p) => p.userId === reg.userId && event && p.eventTitle === event.title
      );

      return {
        ...reg,
        user,
        event: event ? { id: event.id, title: event.title, slug: event.slug, venue: event.venue, startTime: event.startTime } : undefined,
        ticket,
        payment,
      };
    });
  }

  registerForEvent(data: { eventId: string; ticketId: string; userId: string; userEmail?: string }): EnrichedRegistration {
    const event = this.events.find((e) => e.id === data.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if already registered
    const existing = this.registrations.find(
      (r) => r.eventId === data.eventId && r.userId === data.userId && r.status !== "CANCELLED"
    );
    if (existing) {
      throw new Error("You are already registered for this event.");
    }

    // Ticket check & capacity
    const ticket = event.tickets?.find((t: any) => t.id === data.ticketId);
    if (!ticket) {
      throw new Error("Selected ticket tier not found.");
    }
    if (ticket.quantityAvailable > 0 && (ticket.quantitySold || 0) >= ticket.quantityAvailable) {
      throw new Error("This ticket tier is sold out.");
    }

    ticket.quantitySold = (ticket.quantitySold || 0) + 1;

    const registrationNumber = `CAMPUS-${event.slug.slice(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newReg = {
      id: `g-${Date.now()}`,
      eventId: data.eventId,
      ticketId: data.ticketId,
      userId: data.userId,
      registrationNumber,
      status: "CONFIRMED" as const,
      checkInTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.registrations.unshift(newReg);

    // Mock payment creation if ticket has cost
    let paymentRecord: PaymentRecord | undefined;
    if (ticket.priceCents > 0) {
      paymentRecord = this.recordPayment({
        userId: data.userId,
        orderId: `order_mock_${Date.now()}`,
        paymentId: `pay_mock_${Date.now()}`,
        amountCents: ticket.priceCents,
        currency: ticket.currency || "INR",
        status: "CAPTURED",
        eventTitle: event.title,
        ticketTitle: ticket.title,
      });
    }

    // Confirmation notification
    this.notifications.unshift({
      id: `n-${Date.now()}`,
      userId: data.userId,
      title: `Registration Confirmed: ${event.title}`,
      message: `Your pass (${ticket.title}) has been verified. Registration #${registrationNumber}`,
      linkUrl: `/events/${event.slug}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    this.logAudit({
      actorId: data.userId,
      action: "EVENT_REGISTRATION",
      resourceType: "event_registration",
      resourceId: newReg.id,
      changes: { eventId: data.eventId, ticketId: data.ticketId, registrationNumber },
    });

    const user = this.users.find((u) => u.id === data.userId);

    return {
      ...newReg,
      user,
      event,
      ticket,
      payment: paymentRecord,
    };
  }

  checkInParticipant(registrationId: string): any {
    const reg = this.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error("Registration record not found");

    reg.checkInTime = reg.checkInTime ? null : new Date().toISOString();

    this.logAudit({
      actorId: "b1111111-1111-4111-8111-111111111111",
      action: reg.checkInTime ? "PARTICIPANT_CHECKED_IN" : "PARTICIPANT_CHECK_IN_REVERSED",
      resourceType: "event_registration",
      resourceId: registrationId,
      changes: { checkInTime: reg.checkInTime },
    });

    return reg;
  }

  // Analytics
  getEventAnalytics(eventId: string): any {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");

    const regs = this.registrations.filter((r) => r.eventId === eventId && r.status !== "CANCELLED");
    const checkedIn = regs.filter((r) => r.checkInTime != null);
    const tickets = event.tickets || [];

    const ticketsBreakdown = tickets.map((t: any) => {
      const sold = t.quantitySold || 0;
      const revenueCents = sold * (t.priceCents || 0);
      return {
        id: t.id,
        title: t.title,
        priceCents: t.priceCents || 0,
        currency: t.currency || "INR",
        quantityAvailable: t.quantityAvailable,
        quantitySold: sold,
        revenueCents,
      };
    });

    const grossRevenueCents = ticketsBreakdown.reduce((sum: number, t: any) => sum + t.revenueCents, 0);

    return {
      eventId: event.id,
      title: event.title,
      slug: event.slug,
      status: event.status,
      maxCapacity: event.maxCapacity || 100,
      totalRegistrations: regs.length,
      capacityUtilization: regs.length > 0 ? Math.max(1, Math.round((regs.length / (event.maxCapacity || 100)) * 100)) : 0,
      checkedInCount: checkedIn.length,
      checkInRate: regs.length > 0 ? Math.round((checkedIn.length / regs.length) * 100) : 0,
      grossRevenueCents,
      ticketsBreakdown,
    };
  }

  getGlobalEventsAnalytics(): any {
    const totalEvents = this.events.length;
    const publishedEvents = this.events.filter((e) => e.status === "PUBLISHED").length;
    const draftEvents = this.events.filter((e) => e.status === "DRAFT").length;
    const totalRegistrations = this.registrations.filter((r) => r.status !== "CANCELLED").length;
    const totalRevenueCents = this.payments
      .filter((p) => p.status === "CAPTURED")
      .reduce((acc, p) => acc + p.amountCents, 0);

    return {
      totalEvents,
      publishedEvents,
      draftEvents,
      totalRegistrations,
      totalRevenueCents,
      totalClubs: this.organizations.length,
    };
  }

  // Payments
  getPayments(userId?: string): PaymentRecord[] {
    if (userId) {
      return this.payments.filter((p) => p.userId === userId);
    }
    return this.payments;
  }

  getPaymentByOrderId(orderId: string): PaymentRecord | undefined {
    return this.payments.find((p) => p.orderId === orderId);
  }

  getPaymentByPaymentId(paymentId: string): PaymentRecord | undefined {
    return this.payments.find((p) => p.paymentId === paymentId);
  }

  createPaymentOrder(data: {
    userId: string;
    orderId: string;
    amountCents: number;
    currency?: string;
    eventId?: string;
    ticketId?: string;
    eventTitle?: string;
    ticketTitle?: string;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }): PaymentRecord {
    // Idempotency: Return existing order if identical key or orderId exists
    if (data.idempotencyKey) {
      const existingKey = this.payments.find((p) => p.idempotencyKey === data.idempotencyKey);
      if (existingKey) return existingKey;
    }

    const existingOrder = this.payments.find((p) => p.orderId === data.orderId);
    if (existingOrder) return existingOrder;

    const now = new Date().toISOString();
    const newPayment: PaymentRecord = {
      id: `p-${Date.now()}`,
      userId: data.userId,
      orderId: data.orderId,
      amountCents: data.amountCents,
      amount: data.amountCents,
      currency: data.currency || "INR",
      status: "CREATED",
      eventId: data.eventId,
      ticketId: data.ticketId,
      eventTitle: data.eventTitle,
      ticketTitle: data.ticketTitle,
      idempotencyKey: data.idempotencyKey,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    this.payments.unshift(newPayment);

    this.logAudit({
      actorId: data.userId,
      action: "PAYMENT_ORDER_CREATED",
      resourceType: "payment",
      resourceId: newPayment.id,
      changes: {
        orderId: data.orderId,
        amountCents: data.amountCents,
        eventId: data.eventId,
        ticketId: data.ticketId,
      },
    });

    return newPayment;
  }

  verifyAndCapturePayment(data: {
    orderId: string;
    paymentId: string;
    signature?: string;
  }): { payment: PaymentRecord; registration: any } {
    const payment = this.payments.find(
      (p) => p.orderId === data.orderId || p.paymentId === data.paymentId
    );
    if (!payment) {
      throw new Error(`Payment order not found for ${data.orderId}`);
    }

    const now = new Date().toISOString();

    // Idempotency: If already CAPTURED and registration exists, return existing
    if (payment.status === "CAPTURED" && payment.registrationId) {
      const existingReg = this.registrations.find((r) => r.id === payment.registrationId);
      if (existingReg) {
        return { payment, registration: existingReg };
      }
    }

    payment.paymentId = data.paymentId;
    if (data.signature) {
      payment.signature = data.signature;
    }
    payment.status = "CAPTURED";
    payment.updatedAt = now;

    let reg = payment.registrationId
      ? this.registrations.find((r) => r.id === payment.registrationId)
      : undefined;

    if (!reg && payment.eventId && payment.ticketId) {
      const event = this.events.find((e) => e.id === payment.eventId);
      const ticket = event?.tickets?.find((t: any) => t.id === payment.ticketId);

      if (ticket) {
        ticket.quantitySold = (ticket.quantitySold || 0) + 1;
      }

      const registrationNumber = `CAMPUS-${(event?.slug || "PASS").slice(0, 4).toUpperCase()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      reg = {
        id: `g-${Date.now()}`,
        eventId: payment.eventId,
        ticketId: payment.ticketId,
        userId: payment.userId,
        registrationNumber,
        status: "CONFIRMED" as const,
        checkInTime: null,
        createdAt: now,
        updatedAt: now,
      };

      this.registrations.unshift(reg);
      payment.registrationId = reg.id;

      // Confirmation notification
      this.notifications.unshift({
        id: `n-${Date.now()}`,
        userId: payment.userId,
        title: `Registration Confirmed: ${event?.title || payment.eventTitle || "Campus Event"}`,
        message: `Your pass (${ticket?.title || payment.ticketTitle || "Ticket"}) has been verified. Registration #${registrationNumber}`,
        linkUrl: event?.slug ? `/events/${event.slug}` : "/events",
        isRead: false,
        createdAt: now,
      });

      this.logAudit({
        actorId: payment.userId,
        action: "EVENT_REGISTRATION",
        resourceType: "event_registration",
        resourceId: reg.id,
        changes: {
          eventId: payment.eventId,
          ticketId: payment.ticketId,
          registrationNumber,
          paymentId: data.paymentId,
        },
      });
    }

    this.logAudit({
      actorId: payment.userId,
      action: "PAYMENT_CAPTURED",
      resourceType: "payment",
      resourceId: payment.id,
      changes: {
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amountCents: payment.amountCents,
        status: "CAPTURED",
      },
    });

    return { payment, registration: reg };
  }

  markPaymentFailed(data: {
    orderId?: string;
    paymentId?: string;
    errorCode?: string;
    errorDescription?: string;
  }): PaymentRecord | undefined {
    const payment = this.payments.find(
      (p) =>
        (data.orderId && p.orderId === data.orderId) ||
        (data.paymentId && p.paymentId === data.paymentId)
    );
    if (!payment) return undefined;

    payment.status = "FAILED";
    payment.errorCode = data.errorCode || "PAYMENT_FAILED";
    payment.errorDescription =
      data.errorDescription || "Payment was declined or failed verification.";
    payment.updatedAt = new Date().toISOString();

    this.logAudit({
      actorId: payment.userId,
      action: "PAYMENT_FAILED",
      resourceType: "payment",
      resourceId: payment.id,
      changes: {
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        errorCode: payment.errorCode,
        errorDescription: payment.errorDescription,
      },
    });

    return payment;
  }

  processPaymentRefund(paymentId: string, refundId?: string): PaymentRecord | undefined {
    const payment = this.payments.find(
      (p) => p.paymentId === paymentId || p.orderId === paymentId
    );
    if (!payment) return undefined;

    payment.status = "REFUNDED";
    payment.updatedAt = new Date().toISOString();
    payment.metadata = {
      ...(payment.metadata || {}),
      refundId: refundId || `rfnd_${Date.now()}`,
    };

    if (payment.registrationId) {
      const reg = this.registrations.find((r) => r.id === payment.registrationId);
      if (reg) {
        reg.status = "CANCELLED";
        reg.updatedAt = new Date().toISOString();
      }
    }

    this.logAudit({
      actorId: payment.userId,
      action: "PAYMENT_REFUNDED",
      resourceType: "payment",
      resourceId: payment.id,
      changes: {
        paymentId: payment.paymentId,
        refundId,
        status: "REFUNDED",
      },
    });

    return payment;
  }

  // Webhook event tracking for idempotency
  isWebhookEventProcessed(eventId: string): boolean {
    return this.processedWebhooks.has(eventId);
  }

  recordWebhookEvent(eventId: string): void {
    this.processedWebhooks.add(eventId);
  }

  recordPayment(payment: any): PaymentRecord {
    const now = new Date().toISOString();
    const newPayment: PaymentRecord = {
      ...payment,
      id: `p-${Date.now()}`,
      amount: payment.amountCents || payment.amount || 0,
      amountCents: payment.amountCents || payment.amount || 0,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.unshift(newPayment);

    this.logAudit({
      actorId: payment.userId,
      action: "PAYMENT_CAPTURED",
      resourceType: "payment",
      resourceId: newPayment.id,
      changes: { amountCents: payment.amountCents, orderId: payment.orderId },
    });

    return newPayment;
  }

  // Tasks
  getTasks(userId?: string): Task[] {
    if (userId) {
      return this.tasks.filter((t) => t.userId === userId);
    }
    return this.tasks;
  }

  createTask(task: any): Task {
    const newTask = {
      ...task,
      id: task.id || `k-${Date.now()}`,
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    return newTask;
  }

  updateTaskStatus(taskId: string, status: Task["status"]): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      return task;
    }
    return undefined;
  }

  // Attendance
  getAttendance(userId?: string): AttendanceRecord[] {
    if (userId) {
      return this.attendance.filter((a) => a.userId === userId);
    }
    return this.attendance;
  }

  recordAttendance(record: Omit<AttendanceRecord, "id">): AttendanceRecord {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `l-${Date.now()}`,
    };
    this.attendance.unshift(newRecord);
    return newRecord;
  }

  // Resources
  getResources(): Resource[] {
    return this.resources;
  }

  bookResource(resourceId: string, bookedBy: string): Resource | undefined {
    const res = this.resources.find((r) => r.id === resourceId);
    if (res) {
      res.isAvailable = false;
      this.logAudit({
        actorId: bookedBy,
        action: "RESOURCE_BOOKED",
        resourceType: "resource",
        resourceId: res.id,
        changes: { name: res.name },
      });
      return res;
    }
    return undefined;
  }

  // Organizations & Memberships
  getOrganizations(): any[] {
    return this.organizations;
  }

  getOrganizationBySlug(slug: string): any | undefined {
    return this.organizations.find((o) => o.slug === slug);
  }

  getMemberships(organizationId?: string, userId?: string): MembershipRecord[] {
    return this.memberships.filter((m) => {
      if (organizationId && m.organizationId !== organizationId) return false;
      if (userId && m.userId !== userId) return false;
      return true;
    });
  }

  // Notifications
  getNotifications(userId?: string): NotificationRecord[] {
    if (userId) {
      return this.notifications.filter((n) => n.userId === userId);
    }
    return this.notifications;
  }

  markNotificationRead(notificationId: string): boolean {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  // Google Connections
  getGoogleConnection(userId: string): GoogleConnectionRecord | undefined {
    return this.googleConnections.find((c) => c.userId === userId);
  }

  upsertGoogleConnection(data: {
    userId: string;
    googleUserId: string;
    email: string;
    encryptedRefreshToken: string;
    scope: string;
    tokenExpiry?: string;
  }): GoogleConnectionRecord {
    const existingIndex = this.googleConnections.findIndex((c) => c.userId === data.userId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: GoogleConnectionRecord = {
        ...this.googleConnections[existingIndex],
        ...data,
        updatedAt: now,
      };
      this.googleConnections[existingIndex] = updated;
      this.logAudit({
        actorId: data.userId,
        action: "GOOGLE_CALENDAR_RECONNECTED",
        resourceType: "google_connection",
        resourceId: updated.id,
        changes: { email: data.email, scope: data.scope },
      });
      return updated;
    }

    const newConn: GoogleConnectionRecord = {
      id: `gconn-${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.googleConnections.push(newConn);

    this.logAudit({
      actorId: data.userId,
      action: "GOOGLE_CALENDAR_CONNECTED",
      resourceType: "google_connection",
      resourceId: newConn.id,
      changes: { email: data.email, scope: data.scope },
    });

    return newConn;
  }

  deleteGoogleConnection(userId: string): boolean {
    const idx = this.googleConnections.findIndex((c) => c.userId === userId);
    if (idx >= 0) {
      const removed = this.googleConnections.splice(idx, 1)[0];
      this.logAudit({
        actorId: userId,
        action: "GOOGLE_CALENDAR_DISCONNECTED",
        resourceType: "google_connection",
        resourceId: removed.id,
      });
      return true;
    }
    return false;
  }

  // Calendar Events
  getCalendarEvents(userId: string): CalendarEventRecord[] {
    return this.calendarEvents.filter((e) => e.userId === userId);
  }

  getCalendarEventById(id: string): CalendarEventRecord | undefined {
    return this.calendarEvents.find((e) => e.id === id);
  }

  getCalendarEventByGoogleId(userId: string, googleEventId: string): CalendarEventRecord | undefined {
    return this.calendarEvents.find((e) => e.userId === userId && e.googleEventId === googleEventId);
  }

  createCalendarEvent(event: Omit<CalendarEventRecord, "id" | "createdAt" | "updatedAt">): CalendarEventRecord {
    const now = new Date().toISOString();
    const newEvent: CalendarEventRecord = {
      ...event,
      id: `cal-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.calendarEvents.push(newEvent);
    return newEvent;
  }

  updateCalendarEvent(
    id: string,
    updates: Partial<Omit<CalendarEventRecord, "id" | "userId" | "createdAt">>
  ): CalendarEventRecord | undefined {
    const ev = this.calendarEvents.find((e) => e.id === id);
    if (!ev) return undefined;
    Object.assign(ev, updates, { updatedAt: new Date().toISOString() });
    return ev;
  }

  deleteCalendarEvent(id: string): boolean {
    const idx = this.calendarEvents.findIndex((e) => e.id === id);
    if (idx >= 0) {
      this.calendarEvents.splice(idx, 1);
      return true;
    }
    return false;
  }

  logAudit(audit: Omit<AuditLog, "id" | "createdAt">): AuditLog {
    const newAudit: AuditLog = {
      ...audit,
      id: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ipAddress: audit.ipAddress || "127.0.0.1",
      userAgent: audit.userAgent || "CampusOS Demo Client",
    };
    this.auditLogs.unshift(newAudit);
    return newAudit;
  }
}

export const demoDb = new DemoRepository();
