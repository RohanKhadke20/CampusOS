import type { UserRole, UserProfile } from "@campusos/core";

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  department?: string;
  studentId?: string;
  provider: "google" | "email" | "demo";
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

export interface DemoAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatarUrl: string;
  studentId: string;
  badgeLabel: string;
  description: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  redirectTo?: string;
}
