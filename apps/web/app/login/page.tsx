"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  KeyRound,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
} from "@campusos/ui";
import {
  signInWithGoogle,
  signInWithEmail,
  signInWithDemoAccount,
} from "@/lib/auth/client";
import { DEMO_ACCOUNTS_LIST } from "@/lib/auth/demo-accounts";
import type { UserRole } from "@/lib/auth/types";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingDemoRole, setLoadingDemoRole] = useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? "Authentication failed. Please try again." : null
  );

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle(next);
    if (error) {
      setErrorMessage(error.message);
      setLoadingGoogle(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingEmail(true);
    setErrorMessage(null);
    const { error } = await signInWithEmail(email, password, next);
    if (error) {
      setErrorMessage(error.message);
      setLoadingEmail(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setLoadingDemoRole(role);
    setErrorMessage(null);
    const { error } = await signInWithDemoAccount(role, next);
    if (error) {
      setErrorMessage(error.message);
      setLoadingDemoRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--brand-indigo)] text-white shadow-lg shadow-indigo-600/20 mb-2">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Campus<span className="text-[var(--brand-indigo)]">OS</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Autonomous Operating System for Modern Universities
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[var(--status-critical-surface)] border border-[var(--status-critical-border)] text-[var(--status-critical)] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Authentication Card */}
        <Card variant="default" className="shadow-2xl border-[var(--border-interactive)] overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In to Your Workspace</CardTitle>
            <p className="text-xs text-[var(--text-muted)]">
              Authenticate via University Google SSO or Demo Account
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google OAuth Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full font-semibold relative flex items-center justify-center gap-3 text-xs"
              onClick={handleGoogleSignIn}
              isLoading={loadingGoogle}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google SSO</span>
            </Button>

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-x-0 h-px bg-[var(--border-subtle)]" />
              <span className="relative px-3 bg-[var(--surface)] text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">
                or email sign in
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <Input
                label="Campus Email"
                type="email"
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loadingEmail}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Sign In to CampusOS
              </Button>
            </form>
          </CardContent>

          {/* Seeded Demo Account Switcher */}
          <CardFooter className="bg-[var(--surface-raised)] flex flex-col items-start gap-3 p-4">
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                Seeded Demo Accounts (1-Click)
              </span>
              <Badge variant="brand" size="sm">
                Instant Access
              </Badge>
            </div>

            <div className="w-full space-y-2">
              {DEMO_ACCOUNTS_LIST.map((acc) => {
                const isLoadingThis = loadingDemoRole === acc.role;
                const roleBadgeVariant =
                  acc.role === "ADMIN"
                    ? "critical"
                    : acc.role === "ORGANIZER"
                    ? "brand"
                    : "success";

                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoSignIn(acc.role)}
                    disabled={Boolean(loadingDemoRole)}
                    className="w-full p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-indigo)] hover:bg-[var(--surface-hover)] text-left transition-all duration-150 flex items-center justify-between group focus-ring"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="w-8 h-8 rounded-full object-cover border border-[var(--border-subtle)] shrink-0"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-indigo)] transition-colors flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            ({acc.email})
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[220px]">
                          {acc.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadgeVariant} size="sm">
                        {acc.role}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--brand-indigo)] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardFooter>
        </Card>

        {/* Security Assurance Notice */}
        <div className="text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 font-mono">
          <Shield className="w-3.5 h-3.5 text-[var(--status-success)]" />
          <span>Role-Based Zero Trust Kernel • Server Authoritative</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-4">
          <div className="animate-pulse text-xs text-[var(--text-muted)] font-mono">
            Loading authentication interface...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
