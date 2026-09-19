import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { verifyPaymentSignature } from "@campusos/integrations";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in to verify payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentId, signature } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters (orderId, paymentId, signature)." },
        { status: 400 }
      );
    }

    const payment = demoDb.getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: `Payment order ${orderId} not found in registry.` },
        { status: 404 }
      );
    }

    // CRITICAL SECURITY RULE: NEVER mark payment successful based only on frontend state.
    // Verify HMAC SHA256 signature server-side.
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValidSignature) {
      // Record payment failure with error audit log
      demoDb.markPaymentFailed({
        orderId,
        paymentId,
        errorCode: "INVALID_SIGNATURE",
        errorDescription: "Payment signature failed cryptographic verification.",
      });

      return NextResponse.json(
        { success: false, error: "Cryptographic signature verification failed. Payment cannot be confirmed." },
        { status: 400 }
      );
    }

    // Valid signature: Transition status to CAPTURED and confirm registration idempotently
    const { payment: capturedPayment, registration } = demoDb.verifyAndCapturePayment({
      orderId,
      paymentId,
      signature,
    });

    const event = capturedPayment.eventId ? demoDb.getEventById(capturedPayment.eventId) : undefined;
    const ticket = event?.tickets?.find((t: any) => t.id === capturedPayment.ticketId);

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and event registration confirmed.",
      data: {
        registration,
        payment: {
          id: capturedPayment.id,
          orderId: capturedPayment.orderId,
          paymentId: capturedPayment.paymentId,
          amount: capturedPayment.amount,
          amountCents: capturedPayment.amountCents,
          currency: capturedPayment.currency,
          status: capturedPayment.status,
          createdAt: capturedPayment.createdAt,
          updatedAt: capturedPayment.updatedAt,
        },
        event,
        ticket,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Payment verification encountered an unexpected error." },
      { status: 500 }
    );
  }
}
