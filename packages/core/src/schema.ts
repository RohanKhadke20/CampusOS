import { z } from "zod";

export const UserRoleSchema = z.enum(["STUDENT", "ORGANIZER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const MembershipRoleSchema = z.enum(["MEMBER", "OFFICER", "LEAD"]);
export type MembershipRole = z.infer<typeof MembershipRoleSchema>;

export const EventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]);
export type EventStatus = z.infer<typeof EventStatusSchema>;

export const RegistrationStatusSchema = z.enum(["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

export const PaymentStatusSchema = z.enum(["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const TaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const ResourceTypeSchema = z.enum(["LAB", "HALL", "EQUIPMENT", "ROOM"]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

// Domain Schemas
export const UserProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().url().optional().nullable(),
  studentId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  yearOfStudy: z.number().int().min(1).max(5).optional().nullable(),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  isVerified: z.boolean().default(false),
  createdBy: z.string().uuid().optional().nullable(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const EventSchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3),
  description: z.string().optional().nullable(),
  venue: z.string().min(2),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: EventStatusSchema.default("DRAFT"),
  bannerUrl: z.string().url().optional().nullable(),
  maxCapacity: z.number().int().positive().default(100),
  isPaid: z.boolean().default(false),
  createdBy: z.string().uuid().optional().nullable(),
});
export type Event = z.infer<typeof EventSchema>;

export const EventTicketSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("INR"),
  quantityAvailable: z.number().int().nonnegative().default(100),
  quantitySold: z.number().int().nonnegative().default(0),
  salesStart: z.string().datetime().optional(),
  salesEnd: z.string().datetime(),
});
export type EventTicket = z.infer<typeof EventTicketSchema>;

export const EventRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
  registrationNumber: z.string(),
  status: RegistrationStatusSchema.default("CONFIRMED"),
  checkInTime: z.string().datetime().optional().nullable(),
});
export type EventRegistration = z.infer<typeof EventRegistrationSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid().optional().nullable(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  priority: TaskPrioritySchema.default("MEDIUM"),
  status: TaskStatusSchema.default("TODO"),
  dueDate: z.string().datetime().optional().nullable(),
});
export type Task = z.infer<typeof TaskSchema>;

export const AttendanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  subjectCode: z.string().min(2),
  subjectName: z.string().min(2),
  sessionDate: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
  remarks: z.string().optional().nullable(),
});
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const ResourceSchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional().nullable(),
  name: z.string().min(2),
  type: ResourceTypeSchema,
  capacity: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid().optional(),
  actorId: z.string().uuid().optional().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  changes: z.record(z.any()).optional().nullable(),
  createdAt: z.string().datetime().optional(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
