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

class DemoRepository {
  private users: CampusUser[] = demoData.users as CampusUser[];
  private events: any[] = [...demoData.events];
  private tasks: any[] = [...demoData.tasks];
  private attendance: any[] = [...demoData.attendance];
  private resources: any[] = [...demoData.resources];
  private organizations: any[] = [...demoData.organizations];
  private registrations: EventRegistration[] = [];
  private payments: PaymentRecord[] = [
    {
      id: "pay-seed-01",
      userId: "u-student-01",
      orderId: "order_mock_98124",
      paymentId: "pay_mock_34571",
      amountCents: 49900,
      currency: "INR",
      status: "CAPTURED",
      eventTitle: "CampusHack 2026: AI & Edge Systems",
      ticketTitle: "Student Developer Pass",
      createdAt: "2026-09-18T14:30:00Z",
    },
  ];
  private auditLogs: AuditLog[] = [
    {
      id: "audit-01",
      actorId: "u-admin-01",
      action: "ORGANIZATION_VERIFIED",
      resourceType: "organization",
      resourceId: "org-acm-01",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      changes: { isVerified: true },
      createdAt: "2026-09-18T10:00:00Z",
    },
    {
      id: "audit-02",
      actorId: "u-org-01",
      action: "EVENT_CREATED",
      resourceType: "event",
      resourceId: "ev-hackathon-2026",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      changes: { title: "CampusHack 2026" },
      createdAt: "2026-09-18T11:15:00Z",
    },
  ];

  // User queries
  getUsers(): CampusUser[] {
    return this.users;
  }

  getUserById(id: string): CampusUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  // Events
  getEvents(): any[] {
    return this.events;
  }

  getEventById(id: string): any | undefined {
    return this.events.find((e) => e.id === id);
  }

  createEvent(event: any): any {
    const newEvent = {
      ...event,
      id: event.id || `ev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.events.unshift(newEvent);

    this.logAudit({
      actorId: event.createdBy || "u-org-01",
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
      id: `reg-${Date.now()}`,
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
      id: `pay-${Date.now()}`,
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
      id: task.id || `tsk-${Date.now()}`,
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
      id: `att-${Date.now()}`,
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

  // Organizations
  getOrganizations(): any[] {
    return this.organizations;
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
