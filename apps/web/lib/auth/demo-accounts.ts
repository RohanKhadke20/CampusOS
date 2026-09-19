import type { DemoAccount, UserRole } from "./types";

export const SEEDED_DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  STUDENT: {
    id: "u-student-01",
    email: "student@campusos.edu",
    name: "Alex Chen",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    studentId: "CS-2024-042",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    badgeLabel: "Undergraduate Student",
    description: "Standard student account with course enrollment, BLE attendance, and hackathon registration.",
  },
  ORGANIZER: {
    id: "u-org-01",
    email: "organizer@campusos.edu",
    name: "Sarah Jenkins",
    role: "ORGANIZER",
    department: "Robotics & Automation Society",
    studentId: "EE-2023-118",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    badgeLabel: "Club Lead / Organizer",
    description: "Event organizer with permissions to host hackathons, issue ticket tiers, and book facilities.",
  },
  ADMIN: {
    id: "u-admin-01",
    email: "admin@campusos.edu",
    name: "Dr. Marcus Vance",
    role: "ADMIN",
    department: "Dean of Academic & Student Affairs",
    studentId: "FAC-901",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    badgeLabel: "Campus Superadmin",
    description: "Highest administrative clearance with access to Admin Console, user management, and security audit ledger.",
  },
};

export const DEMO_ACCOUNTS_LIST: DemoAccount[] = Object.values(SEEDED_DEMO_ACCOUNTS);

export function getDemoAccountByRole(role: UserRole): DemoAccount {
  return SEEDED_DEMO_ACCOUNTS[role] || SEEDED_DEMO_ACCOUNTS.STUDENT;
}

export function getDemoAccountByEmail(email: string): DemoAccount | null {
  const normalized = email.trim().toLowerCase();
  for (const account of DEMO_ACCOUNTS_LIST) {
    if (account.email.toLowerCase() === normalized) return account;
  }
  // Check common demo aliases
  if (normalized.includes("student") || normalized.includes("alex")) {
    return SEEDED_DEMO_ACCOUNTS.STUDENT;
  }
  if (normalized.includes("organizer") || normalized.includes("sarah") || normalized.includes("lead")) {
    return SEEDED_DEMO_ACCOUNTS.ORGANIZER;
  }
  if (normalized.includes("admin") || normalized.includes("dean") || normalized.includes("vance")) {
    return SEEDED_DEMO_ACCOUNTS.ADMIN;
  }
  return null;
}
