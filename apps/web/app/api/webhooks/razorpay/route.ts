import { NextRequest, NextResponse } from "next/server";
import { demoDb } from "@campusos/db";
import { verifyWebhookSignature } from "@campusos/integrations";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // Cryptographic validation of raw body before JSON parsing
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    const eventType = payload.event;
    const eventId =
      payload.event_id ||
      request.headers.get("x-razorpay-event-id") ||
      `evt_${payload.event}_${payload.payload?.payment?.entity?.id || payload.payload?.refund?.entity?.id || Date.now()}`;

    // Idempotency: Ignore duplicate webhook deliveries
    if (demoDb.isWebhookEventProcessed(eventId)) {
      return NextResponse.json(
        {
          success: true,
          received: true,
          message: "Duplicate webhook delivery safely ignored.",
          duplicate: true,
          eventId,
        },
        { status: 200 }
      );
    }

    // Record event ID to guarantee idempotency
    demoDb.recordWebhookEvent(eventId);

    // Process supported Razorpay events
    switch (eventType) {
      case "payment.captured": {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;

          if (orderId) {
            demoDb.verifyAndCapturePayment({
              orderId,
              paymentId,
            });
          }
        }
        break;
      }

      case "payment.failed": {
        const paymentEntity = payload.payload?.payment?.entity;
        if (paymentEntity) {
          const orderId = paymentEntity.order_id;
          const paymentId = paymentEntity.id;
          const errorCode = paymentEntity.error_code || "PAYMENT_FAILED";
          const errorDescription =
            paymentEntity.error_description || "Payment failed at gateway processor.";

          demoDb.markPaymentFailed({
            orderId,
            paymentId,
            errorCode,
            errorDescription,
          });
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = payload.payload?.refund?.entity;
        if (refundEntity) {
          const paymentId = refundEntity.payment_id;
          const refundId = refundEntity.id;

          if (paymentId) {
            demoDb.processPaymentRefund(paymentId, refundId);
          }
        }
        break;
      }

      default:
        // Other events acknowledged gracefully
        break;
    }

    return NextResponse.json(
      {
        success: true,
        received: true,
        event: eventType,
        eventId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error." },
      { status: 500 }
    );
  }
}
