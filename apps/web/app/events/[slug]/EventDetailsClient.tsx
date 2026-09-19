"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppContext";
import {
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Tag,
  Share2,
  CreditCard,
  AlertCircle,
  X,
} from "lucide-react";
import { Button, Badge, Card, CardContent } from "@campusos/ui";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function EventDetailsClient({ slug }: { slug: string }) {
  const { activePersona } = useApp();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [registering, setRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${slug}`);
      if (res.ok) {
        const json = await res.json();
        const ev = json.data;
        setEvent(ev);
        if (ev.userRegistration) {
          setRegistrationResult(ev.userRegistration);
        }
        if (ev.tickets && ev.tickets.length > 0) {
          setSelectedTicketId(ev.tickets[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Server-side payment verification
  // SECURITY: NEVER marks payment successful based only on frontend state
  const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      setRegistering(true);
      setPaymentError(null);
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
        }),
      });
      const verifyJson = await verifyRes.json();
      if (verifyRes.ok && verifyJson.success) {
        setRegistrationResult(verifyJson.data.registration);
        setCheckoutOrder(null);
        fetchEvent();
      } else {
        const errMsg = verifyJson.error || "Payment cryptographic verification failed.";
        setPaymentError(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || "Network error during verification";
      setPaymentError(errMsg);
    } finally {
      setRegistering(false);
    }
  };

  const handleRegister = async () => {
    if (!event || !selectedTicketId) return;
    setPaymentError(null);

    const selectedTicket = event.tickets?.find((t: any) => t.id === selectedTicketId);

    // Free ticket flow
    if (!selectedTicket || selectedTicket.priceCents <= 0) {
      try {
        setRegistering(true);
        const res = await fetch(`/api/events/${event.id}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: selectedTicketId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setRegistrationResult(data.data);
          fetchEvent();
        } else {
          setPaymentError(data.error || "Registration failed");
        }
      } catch (err: any) {
        setPaymentError(err.message || "Network error");
      } finally {
        setRegistering(false);
      }
      return;
    }

    // Paid ticket flow: Step 1 -> Create Razorpay Order Server-side
    try {
      setRegistering(true);
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketId: selectedTicketId,
          idempotencyKey: `idemp_${event.id}_${selectedTicketId}_${Date.now()}`,
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        setPaymentError(orderJson.error || "Order creation failed.");
        setRegistering(false);
        return;
      }

      const orderData = orderJson.data;

      // Step 2 -> Launch Razorpay Checkout
      const scriptReady = await loadRazorpayScript();
      if (scriptReady && typeof (window as any).Razorpay === "function") {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "CampusOS University",
          description: `${orderData.eventTitle} - ${orderData.ticketTitle}`,
          order_id: orderData.orderId,
          prefill: {
            name: activePersona?.name || "Student Attendee",
            email: activePersona?.email || "student@campusos.edu",
          },
          theme: {
            color: "#4f46e5",
          },
          handler: async function (response: any) {
            // Step 3 -> Verify on server
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          },
          modal: {
            ondismiss: function () {
              setRegistering(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (resp: any) {
          setPaymentError(resp.error?.description || "Payment failed at gateway processor.");
          setRegistering(false);
        });
        rzp.open();
      } else {
        // Fallback test sandbox window if checkout.js is blocked by sandbox/CSP/offline
        setCheckoutOrder(orderData);
        setRegistering(false);
      }
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initiate payment order");
      setRegistering(false);
    }
  };

  const handleSimulateTestPayment = async (simulateFailure = false) => {
    if (!checkoutOrder) return;
    try {
      setRegistering(true);
      const res = await fetch("/api/payments/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutOrder.orderId,
          simulateFailure,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await verifyPayment(
          data.data.orderId,
          data.data.paymentId,
          data.data.signature
        );
      } else {
        setPaymentError(data.error || "Simulation error");
        setRegistering(false);
      }
    } catch (err: any) {
      setPaymentError(err.message || "Simulation error");
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[var(--text-muted)] animate-pulse">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16 space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Event Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          The event you are looking for may have been rescheduled or removed.
        </p>
        <Link href="/events">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to All Events
          </Button>
        </Link>
      </div>
    );
  }

  const selectedTicket = event?.tickets?.find((t: any) => t.id === selectedTicketId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back link */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discovery</span>
        </Link>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-[var(--border-subtle)] shadow-md">
        <div className="h-64 sm:h-80 w-full relative">
          <img
            src={
              event.bannerUrl ||
              "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200"
            }
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="brand">{event.status}</Badge>
              <Badge variant={event.isPaid ? "warning" : "success"}>
                {event.isPaid ? "Paid Pass Required" : "Free Campus Admission"}
              </Badge>
            </div>
            {registrationResult && (
              <Badge variant="success" className="bg-emerald-500 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registration Verified
              </Badge>
            )}
          </div>

          {/* Title & Host info */}
          <div className="absolute bottom-4 left-5 right-5 text-white space-y-1.5">
            {event.organization && (
              <div className="flex items-center gap-2 text-xs text-indigo-200">
                <span>Hosted by {event.organization.name}</span>
                {event.organization.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight drop-shadow-md">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Ticket / Pass Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Event Specs */}
        <div className="md:col-span-2 space-y-6">
          {/* Logistics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo)]/10 flex items-center justify-center text-[var(--brand-indigo)] flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Date & Time
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                  {new Date(event.startTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {new Date(event.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(event.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-indigo)]/10 flex items-center justify-center text-[var(--brand-indigo)] flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Campus Venue
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                  {event.venue}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Capacity: {event.maxCapacity} seats ({event.registrationCount} filled)
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card variant="default">
            <CardContent className="space-y-3 p-5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                Event Overview
              </h3>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
                <p>{event.description}</p>
                <p>
                  Attendees will receive official certificate credits recorded directly onto their
                  verified academic profile. Refreshments and developer swag will be provided.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Registration / Pass Widget */}
        <div className="space-y-4">
          {registrationResult ? (
            /* VERIFIED PASS CARD */
            <div className="p-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 backdrop-blur-sm space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Official Pass</span>
                </div>
                <Badge variant="success" size="sm">
                  {registrationResult.status || "CONFIRMED"}
                </Badge>
              </div>

              <div className="space-y-2 text-center py-2">
                <div className="text-[10px] text-emerald-300/70 uppercase font-mono tracking-widest">
                  Registration Code
                </div>
                <div className="text-base font-mono font-bold text-emerald-300 tracking-wider">
                  {registrationResult.registrationNumber}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Holder:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{activePersona.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Student ID:</span>
                  <span className="font-mono text-[var(--text-secondary)]">{activePersona.studentId || "CS-2024-042"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Check-in:</span>
                  <span className={registrationResult.checkInTime ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                    {registrationResult.checkInTime ? "Verified" : "Pending Arrival"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 flex items-center justify-center gap-2 text-xs text-emerald-300">
                <QrCode className="w-5 h-5" />
                <span className="text-[11px] font-medium">Valid for Admission</span>
              </div>
            </div>
          ) : (
            /* TICKET REGISTRATION FORM */
            <Card variant="highlight" className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Ticket className="w-4 h-4 text-[var(--brand-indigo)]" />
                  Select Pass Tier
                </h3>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {event.tickets?.length || 0} tier(s)
                </span>
              </div>

              <div className="space-y-2.5">
                {event.tickets?.map((tkt: any) => {
                  const isSelected = selectedTicketId === tkt.id;
                  const isSoldOut = tkt.quantityAvailable > 0 && tkt.quantitySold >= tkt.quantityAvailable;

                  return (
                    <div
                      key={tkt.id}
                      onClick={() => !isSoldOut && setSelectedTicketId(tkt.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[var(--surface-raised)] border-[var(--brand-indigo)] shadow-sm"
                          : isSoldOut
                          ? "opacity-50 cursor-not-allowed bg-[var(--surface)] border-[var(--border-subtle)]"
                          : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--border-interactive)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[var(--brand-indigo)] bg-[var(--brand-indigo)]"
                              : "border-[var(--border-subtle)]"
                          }`}
                        >
                          {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">
                            {tkt.title}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {tkt.quantityAvailable - (tkt.quantitySold || 0)} available
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                        {tkt.priceCents === 0 ? "Free" : `₹${(tkt.priceCents / 100).toFixed(0)}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {paymentError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold">Payment Notice</span>
                    <p className="text-[11px] text-red-300/90 leading-tight">{paymentError}</p>
                  </div>
                </div>
              )}

              {selectedTicket && selectedTicket.priceCents > 0 && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Razorpay TEST MODE</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-200">
                    INR Sandbox
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Button
                  size="md"
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleRegister}
                  disabled={registering || !selectedTicketId}
                >
                  {registering
                    ? "Verifying with Gateway..."
                    : selectedTicket && selectedTicket.priceCents > 0
                    ? `Pay ₹${(selectedTicket.priceCents / 100).toFixed(0)} & Register`
                    : "Register Now"}
                </Button>
              </div>

              <p className="text-[10px] text-center text-[var(--text-muted)] leading-normal">
                By registering you confirm attendance and compliance with university code of conduct.
              </p>
            </Card>
          )}

          {/* RAZORPAY TEST MODE CHECKOUT MODAL (Fallback / Sandbox) */}
          {checkoutOrder && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 space-y-5 shadow-2xl relative">
                <button
                  onClick={() => setCheckoutOrder(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">Razorpay Test Gateway</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Complete simulated transaction for {checkoutOrder.eventTitle}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="font-mono text-indigo-300">{checkoutOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-bold text-white font-mono">
                      ₹{(checkoutOrder.amount / 100).toFixed(2)} {checkoutOrder.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Key ID:</span>
                    <span className="font-mono text-slate-300">{checkoutOrder.keyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mode:</span>
                    <span className="text-amber-400 font-semibold">TEST MODE ONLY</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Button
                    size="md"
                    variant="primary"
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-500"
                    disabled={registering}
                    onClick={() => handleSimulateTestPayment(false)}
                  >
                    {registering ? "Verifying Signature..." : "Simulate Successful Test Payment"}
                  </Button>

                  <Button
                    size="md"
                    variant="outline"
                    className="w-full justify-center border-red-500/40 text-red-400 hover:bg-red-500/10"
                    disabled={registering}
                    onClick={() => handleSimulateTestPayment(true)}
                  >
                    Simulate Payment Failure (Invalid Signature)
                  </Button>
                </div>

                <p className="text-[10px] text-center text-slate-500">
                  CRITICAL: All payments require server-side HMAC SHA256 cryptographic verification before any registration is confirmed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
