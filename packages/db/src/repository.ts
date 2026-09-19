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
  currency: string;
  status: "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";
  eventTitle: string;
  ticketTitle: string;
  createdAt: string;
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

export interface MembershipRecord {
  organizationId: string;
  userId: string;
  role: "MEMBER" | "OFFICER" | "LEAD";
}

class DemoRepository {
  private users: CampusUser[] = demoData.users as CampusUser[];
  private events: any[] = [...demoData.events];
  private tasks: any[] = [...demoData.tasks];
  private attendance: any[] = [...demoData.attendance];
  private resources: any[] = [...demoData.resources];
  private organizations: any[] = [...demoData.organizations];
  private memberships: MembershipRecord[] = [...(demoData.memberships as MembershipRecord[])];
  private registrations: any[] = [...demoData.registrations];
  private payments: PaymentRecord[] = [...(demoData.payments as PaymentRecord[])];
  private notifications: NotificationRecord[] = [...(demoData.notifications as NotificationRecord[])];
  private auditLogs: AuditLog[] = [...(demoData.auditLogs as AuditLog[])];

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
  getEvents(): any[] {
    return this.events;
  }

  getEventById(id: string): any | undefined {
    return this.events.find((e) => e.id === id);
  }

  getEventBySlug(slug: string): any | undefined {
    return this.events.find((e) => e.slug === slug);
  }

  createEvent(event: any): any {
    const newEvent = {
      ...event,
      id: event.id || `ev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.events.unshift(newEvent);

    this.logAudit({
      actorId: event.createdBy || "b2222222-2222-4222-8222-222222222222",
      action: "EVENT_CREATED",
      resourceType: "event",
      resourceId: newEvent.id,
      changes: { title: newEvent.title, venue: newEvent.venue },
    });

    return newEvent;
  }

  // Registrations & Payments
  getRegistrations(userId?: string): EventRegistration[] {
    if (userId) {
      return this.registrations.filter((r) => r.userId === userId);
    }
    return this.registrations;
  }

  registerForEvent(reg: Omit<EventRegistration, "id" | "registrationNumber">): EventRegistration {
    const newReg: EventRegistration = {
      ...reg,
      id: `g-${Date.now()}`,
      registrationNumber: `CAMPUS-REG-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    this.registrations.unshift(newReg);

    this.logAudit({
      actorId: reg.userId,
      action: "EVENT_REGISTRATION",
      resourceType: "event_registration",
      resourceId: newReg.id,
      changes: { eventId: reg.eventId, ticketId: reg.ticketId },
    });

    return newReg;
  }

  getPayments(userId?: string): PaymentRecord[] {
    if (userId) {
      return this.payments.filter((p) => p.userId === userId);
    }
    return this.payments;
  }

  recordPayment(payment: Omit<PaymentRecord, "id" | "createdAt">): PaymentRecord {
    const newPayment: PaymentRecord = {
      ...payment,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
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
