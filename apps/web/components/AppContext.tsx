"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserRole } from "@campusos/core";

interface PersonaUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl: string;
}

const PERSONAS: PersonaUser[] = [
  {
    id: "u-student-01",
    name: "Alex Chen",
    email: "alex.student@campus.edu",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "u-org-01",
    name: "Sarah Jenkins",
    email: "sarah.lead@campus.edu",
    role: "ORGANIZER",
    department: "Robotics Society Lead",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
  },
  {
    id: "u-admin-01",
    name: "Dr. Marcus Vance",
    email: "dean.admin@campus.edu",
    role: "ADMIN",
    department: "Dean of Academic Affairs",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
];

interface AppContextType {
  activePersona: PersonaUser;
  setPersona: (role: UserRole) => void;
  personas: PersonaUser[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = useState<PersonaUser>(PERSONAS[0]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const setPersona = (role: UserRole) => {
    const found = PERSONAS.find((p) => p.role === role);
    if (found) setActivePersona(found);
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
