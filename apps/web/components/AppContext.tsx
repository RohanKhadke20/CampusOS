"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserRole } from "@campusos/core";
import { signOut as clientSignOut, signInWithDemoAccount } from "@/lib/auth/client";
import { SEEDED_DEMO_ACCOUNTS, DEMO_ACCOUNTS_LIST } from "@/lib/auth/demo-accounts";
import type { AuthUser } from "@/lib/auth/types";

export interface PersonaUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl: string;
  studentId?: string;
  provider?: string;
}

const PERSONAS: PersonaUser[] = DEMO_ACCOUNTS_LIST.map((acc) => ({
  id: acc.id,
  name: acc.name,
  email: acc.email,
  role: acc.role,
  department: acc.department,
  avatarUrl: acc.avatarUrl,
  studentId: acc.studentId,
}));

interface AppContextType {
  activePersona: PersonaUser;
  setPersona: (role: UserRole) => Promise<void>;
  personas: PersonaUser[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  logout: () => Promise<void>;
  isLoadingAuth: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = useState<PersonaUser>(PERSONAS[0]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Synchronize authenticated session from server-side
  const refreshAuthSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const user: AuthUser = data.user;
          const foundPersona = PERSONAS.find((p) => p.role === user.role);
          setActivePersona({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role, // Server-authoritative role
            department: user.department || foundPersona?.department || "Campus Academic Unit",
            avatarUrl: user.avatarUrl || foundPersona?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            studentId: user.studentId || foundPersona?.studentId,
            provider: user.provider,
          });
        }
      }
    } catch {
      // Offline / fallback to default persona
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthSession();
  }, [refreshAuthSession]);

  // Set persona updating server session cookie
  const setPersona = async (role: UserRole) => {
    setIsLoadingAuth(true);
    try {
      await signInWithDemoAccount(role);
      const found = PERSONAS.find((p) => p.role === role);
      if (found) setActivePersona(found);
      // If student was on admin tab and switches to student, redirect to dashboard
      if (role === "STUDENT" && (activeTab === "admin" || activeTab === "audit")) {
        setActiveTab("dashboard");
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    await clientSignOut();
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        activePersona,
        setPersona,
        personas: PERSONAS,
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        logout,
        isLoadingAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
