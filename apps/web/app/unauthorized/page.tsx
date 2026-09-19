"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut, KeyRound } from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, CardFooter } from "@campusos/ui";
import { signOut, signInWithDemoAccount } from "@/lib/auth/client";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const requiredRole = searchParams.get("required") || "ADMIN";
  const currentRole = searchParams.get("current") || "STUDENT";
  const reason = searchParams.get("reason") || "Access restricted by CampusOS RBAC Policy";

  const handleSwitchToAdmin = async () => {
    await signInWithDemoAccount("ADMIN", "/");
  };

  const handleSwitchToOrganizer = async () => {
    await signInWithDemoAccount("ORGANIZER", "/");
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-4">
      <Card variant="default" className="max-w-lg w-full overflow-hidden shadow-2xl border-[var(--border-interactive)]">
        <CardHeader className="bg-[var(--status-critical-surface)] border-b border-[var(--status-critical-border)] p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--status-critical)] text-white flex items-center justify-center shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg text-[var(--status-critical)]">
                403 - Access Forbidden
              </CardTitle>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Security boundary violation detected by CampusOS Zero-Trust Kernel
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="p-3.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Current Authenticated Role:</span>
              <Badge variant="neutral" size="sm">
                {currentRole}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Required Authorization Level:</span>
              <Badge variant="critical" size="sm">
                {requiredRole}
              </Badge>
            </div>
          </div>

          <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <p>
              Your authenticated session does not possess the cryptographic privilege tokens
              required to access this console. Server-side authorization resolution rejected
              the operation.
            </p>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2.5">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Quick Escalation (Demo Mode)
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="xs"
                variant="primary"
                onClick={handleSwitchToAdmin}
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
              >
                Switch to Admin Persona
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={handleSwitchToOrganizer}
              >
                Switch to Organizer
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-[var(--surface-raised)] p-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push("/")}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => signOut()}
            leftIcon={<LogOut className="w-4 h-4 text-[var(--status-critical)]" />}
          >
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-4">
          <div className="animate-pulse text-xs text-[var(--text-muted)] font-mono">
            Verifying security boundary...
          </div>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
