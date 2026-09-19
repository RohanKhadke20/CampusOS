"use client";

import React, { useState } from "react";
import { useApp } from "../AppContext";
import { demoDb } from "@campusos/db";
import { CreditCard, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@campusos/ui";

export function PaymentsView() {
  const { activePersona } = useApp();
  const [payments] = useState(() => demoDb.getPayments(activePersona.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Payment Transactions & Receipts
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Razorpay payment records, ticket receipts, and refund statuses.
        </p>
      </div>

      {payments.length === 0 ? (
        <Card variant="default" className="p-8 text-center text-[var(--text-muted)] text-xs">
          No transactions found for this account. Register for a paid hackathon pass in the Events tab to simulate an order.
        </Card>
      ) : (
        <Card variant="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction Ledger</CardTitle>
            <Badge variant="success" size="sm" withDot>
              Razorpay Verified
            </Badge>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event & Ticket Tier</TableHead>
                  <TableHead>Order & Payment IDs</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold text-[var(--text-primary)]">{p.eventTitle}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">Tier: {p.ticketTitle}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[11px] text-[var(--text-secondary)]">{p.orderId}</div>
                      {p.paymentId && (
                        <div className="text-[10px] font-mono text-[var(--brand-indigo)]">{p.paymentId}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-[var(--text-muted)]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-[var(--text-primary)]">
                      ₹{p.amountCents / 100}.00 {p.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success" size="sm">
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
