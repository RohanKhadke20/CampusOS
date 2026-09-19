import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { createRazorpayOrder, getPublicRazorpayKey } from "@campusos/integrations";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in to proceed with payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, ticketId, idempotencyKey } = body;

    if (!eventId || !ticketId) {
      return NextResponse.json(
        { success: false, error: "Event ID and Ticket Tier ID are required." },
        { status: 400 }
      );
    }

    const event = demoDb.getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found." },
        { status: 404 }
      );
    }

    if (event.status !== "PUBLISHED" && user.role === "STUDENT") {
      return NextResponse.json(
        { success: false, error: "This event is not published for student registration." },
        { status: 400 }
      );
    }

    const ticket = event.tickets?.find((t: any) => t.id === ticketId);
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Selected ticket tier not found." },
        { status: 404 }
      );
    }

    if (ticket.priceCents <= 0) {
      return NextResponse.json(
        { success: false, error: "This ticket tier is free. Please use direct registration." },
        { status: 400 }
      );
    }

    if (ticket.quantityAvailable > 0 && (ticket.quantitySold || 0) >= ticket.quantityAvailable) {
      return NextResponse.json(
        { success: false, error: "Selected ticket tier is sold out." },
        { status: 400 }
      );
    }

    // Check if user is already registered for this event
    const userRegistrations = demoDb.getRegistrations({ userId: user.id });
    const alreadyRegistered = userRegistrations.some(
      (r) => r.eventId === eventId && r.status !== "CANCELLED"
    );
    if (alreadyRegistered) {
      return NextResponse.json(
        { success: false, error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    // Check idempotency: If order with this idempotency key already exists, return it
    if (idempotencyKey) {
      const existing = demoDb.getPayments(user.id).find((p) => p.idempotencyKey === idempotencyKey);
      if (existing) {
        return NextResponse.json({
          success: true,
          data: {
            orderId: existing.orderId,
            amount: existing.amountCents,
            currency: existing.currency,
            keyId: getPublicRazorpayKey(),
            eventTitle: event.title,
            ticketTitle: ticket.title,
          },
        });
      }
    }

    const receipt = `rcpt_${user.id.slice(0, 6)}_${Date.now().toString().slice(-6)}`;

    // Create order server-side via Razorpay
    const orderResult = await createRazorpayOrder({
      amountCents: ticket.priceCents,
      currency: ticket.currency || "INR",
      receipt,
      idempotencyKey,
      notes: {
        eventId,
        ticketId,
        userId: user.id,
        userEmail: user.email,
        eventTitle: event.title,
        ticketTitle: ticket.title,
      },
    });

    // Store in database with status CREATED
    demoDb.createPaymentOrder({
      userId: user.id,
      orderId: orderResult.id,
      amountCents: ticket.priceCents,
      currency: ticket.currency || "INR",
      eventId,
      ticketId,
      eventTitle: event.title,
      ticketTitle: ticket.title,
      idempotencyKey,
      metadata: {
        receipt,
        userEmail: user.email,
        paymentGateway: "razorpay_test_mode",
      },
    });

    // Return order details (Key Secret NEVER exposed)
    return NextResponse.json({
      success: true,
      data: {
        orderId: orderResult.id,
        amount: orderResult.amount,
        currency: orderResult.currency,
        keyId: getPublicRazorpayKey(),
        eventTitle: event.title,
        ticketTitle: ticket.title,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate payment order." },
      { status: 500 }
    );
  }
}
