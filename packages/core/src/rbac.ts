import { UserRole } from "./schema.js";

export type Permission =
  | "events:read"
  | "events:create"
  | "events:update"
  | "events:delete"
  | "events:register"
  | "clubs:read"
  | "clubs:manage"
  | "tasks:manage_own"
  | "tasks:manage_all"
  | "attendance:read_own"
  | "attendance:record"
  | "resources:book"
  | "resources:manage"
  | "payments:initiate"
  | "payments:refund"
  | "admin:access"
  | "admin:users_manage"
  | "admin:audit_read";

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  STUDENT: [
    "events:read",
    "events:register",
    "clubs:read",
    "tasks:manage_own",
    "attendance:read_own",
    "resources:book",
    "payments:initiate",
  ],
  ORGANIZER: [
    "events:read",
    "events:create",
    "events:update",
    "events:register",
    "clubs:read",
    "clubs:manage",
    "tasks:manage_own",
    "attendance:read_own",
    "attendance:record",
    "resources:book",
    "resources:manage",
    "payments:initiate",
  ],
  ADMIN: [
    "events:read",
    "events:create",
    "events:update",
    "events:delete",
    "events:register",
    "clubs:read",
    "clubs:manage",
    "tasks:manage_own",
    "tasks:manage_all",
    "attendance:read_own",
    "attendance:record",
    "resources:book",
    "resources:manage",
    "payments:initiate",
    "payments:refund",
    "admin:access",
    "admin:users_manage",
    "admin:audit_read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}
