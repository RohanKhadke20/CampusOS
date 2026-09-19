"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw, FileText } from "lucide-react";

export function PaymentsView() {
  const { activePersona } = useApp();
  const [payments] = useState(() => demoDb.getPayments(activePersona.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          Payment Transactions & Receipts
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Razorpay payment records, ticket receipts, and refund statuses.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-xs">
          No transactions found for this account. Register for a paid hackathon pass in the Events tab to simulate an order.
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--foreground)]">
            <span>Transaction Ledger</span>
            <span className="font-mono text-[10px] text-emerald-400 font-normal">
              Razorpay Verified
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-[var(--foreground)]">{p.eventTitle}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Tier: {p.ticketTitle} • Order ID: <span className="font-mono">{p.orderId}</span>
                  </div>
                  {p.paymentId && (
                    <div className="text-[10px] font-mono text-[var(--brand-accent)] mt-0.5">
                      Payment ID: {p.paymentId}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <div className="font-mono font-bold text-sm text-[var(--foreground)]">
                      ₹{p.amountCents / 100}.00 {p.currency}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
