import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { demoDb } from "@campusos/db";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  generateTestPaymentSignature,
  generateTestWebhookSignature,
  getPublicRazorpayKey,
} from "@campusos/integrations";
import { POST as createOrderHandler } from "../app/api/payments/create-order/route";
import { POST as verifyPaymentHandler } from "../app/api/payments/verify/route";
import { POST as webhookHandler } from "../app/api/webhooks/razorpay/route";

describe("Razorpay TEST MODE - Core Cryptography & Security Tests", () => {
  const testSecret = "Qt1viY6RPd2irAYZrSXvvWW9";
  const webhookSecret = "test_webhook_secret_campusos_2026";

  it("should never expose secret key in public key getter", () => {
    const pubKey = getPublicRazorpayKey();
    assert.ok(pubKey.startsWith("rzp_test_"));
    assert.ok(!pubKey.includes(testSecret));
  });

  it("should verify authentic HMAC SHA256 payment signature using timing-safe comparison", () => {
    const orderId = "order_test_998811";
    const paymentId = "pay_test_443322";
    const validSignature = generateTestPaymentSignature(orderId, paymentId, testSecret);

    const isValid = verifyPaymentSignature(orderId, paymentId, validSignature, testSecret);
    assert.equal(isValid, true, "Authentic signature must be successfully verified");
  });

  it("should reject tampered or invalid payment signature", () => {
    const orderId = "order_test_998811";
    const paymentId = "pay_test_443322";
    const tamperedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const isValid = verifyPaymentSignature(orderId, paymentId, tamperedSignature, testSecret);
    assert.equal(isValid, false, "Tampered signature must be rejected");
  });

  it("should verify authentic webhook signature against raw payload", () => {
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test_100", order_id: "order_test_100" } } },
    });
    const validSignature = generateTestWebhookSignature(rawBody, webhookSecret);

    const isValid = verifyWebhookSignature(rawBody, validSignature, webhookSecret);
    assert.equal(isValid, true, "Authentic webhook signature must be accepted");
  });

  it("should reject webhook with invalid signature", () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    const forgedSignature = "invalid_webhook_signature_string_hex_digest_1234567890abcdef12345678";

    const isValid = verifyWebhookSignature(rawBody, forgedSignature, webhookSecret);
    assert.equal(isValid, false, "Forged webhook signature must be rejected");
  });
});

describe("Razorpay TEST MODE - Server Endpoints & Database State Tests", () => {
  const studentUserId = "a1111111-1111-4111-8111-111111111111";
  const studentUserEmail = "student@campusos.edu";

  // e5555555-5555-4555-8555-555555555555 is Algorithmic Trading & FinTech Symposium (Paid: ₹799)
  // ticket: t6666666-6666-4666-8666-666666666666 (Delegate Pass & Trading Lab License, 79900 cents)
  const paidEventId = "e5555555-5555-4555-8555-555555555555";
  const paidTicketId = "t6666666-6666-4666-8666-666666666666";

  it("should create order server-side without exposing key_secret and store in database", async () => {
    const idempotencyKey = `test_order_idem_${Date.now()}`;
    const req = new NextRequest("http://localhost:3000/api/payments/create-order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        eventId: paidEventId,
        ticketId: paidTicketId,
        idempotencyKey,
      }),
    });

    const res = await createOrderHandler(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.orderId);
    assert.equal(json.data.amount, 79900);
    assert.equal(json.data.currency, "INR");
    assert.ok(json.data.keyId);

    // SECURITY CHECK: Secret must never be in payload
    assert.equal(json.data.keySecret, undefined);
    assert.equal(json.data.key_secret, undefined);

    // Database verification: Order maintained in database with status CREATED
    const payment = demoDb.getPaymentByOrderId(json.data.orderId);
    assert.ok(payment);
    assert.equal(payment.status, "CREATED");
    assert.equal(payment.userId, studentUserId);
    assert.equal(payment.eventId, paidEventId);
    assert.equal(payment.amountCents, 79900);
    assert.equal(payment.currency, "INR");
    assert.ok(payment.createdAt);
    assert.ok(payment.updatedAt);
  });

  it("should enforce order creation idempotency for identical idempotencyKey", async () => {
    const idempotencyKey = `fixed_idemp_key_${Date.now()}`;
    const req1 = new NextRequest("http://localhost:3000/api/payments/create-order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        eventId: paidEventId,
        ticketId: paidTicketId,
        idempotencyKey,
      }),
    });

    const res1 = await createOrderHandler(req1);
    const json1 = await res1.json();

    const req2 = new NextRequest("http://localhost:3000/api/payments/create-order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        eventId: paidEventId,
        ticketId: paidTicketId,
        idempotencyKey,
      }),
    });

    const res2 = await createOrderHandler(req2);
    const json2 = await res2.json();

    assert.equal(json1.data.orderId, json2.data.orderId, "Idempotent requests must return identical orderId");
  });

  it("TEST CASE 1: Successful Verification confirms registration and sets payment status to CAPTURED", async () => {
    // 1. Create order
    const orderRecord = demoDb.createPaymentOrder({
      userId: studentUserId,
      orderId: `order_verify_success_${Date.now()}`,
      amountCents: 79900,
      currency: "INR",
      eventId: paidEventId,
      ticketId: paidTicketId,
      eventTitle: "Algorithmic Trading & FinTech Symposium",
      ticketTitle: "Delegate Pass & Trading Lab License",
    });

    const paymentId = `pay_succ_${Date.now()}`;
    const signature = generateTestPaymentSignature(orderRecord.orderId, paymentId);

    // 2. Submit verify request
    const req = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        orderId: orderRecord.orderId,
        paymentId,
        signature,
      }),
    });

    const res = await verifyPaymentHandler(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.registration);
    assert.equal(json.data.registration.status, "CONFIRMED");
    assert.ok(json.data.registration.registrationNumber.startsWith("CAMPUS-"));
    assert.equal(json.data.payment.status, "CAPTURED");
    assert.equal(json.data.payment.paymentId, paymentId);

    // Database verification: Payment record maintained correctly
    const updatedPayment = demoDb.getPaymentByOrderId(orderRecord.orderId);
    assert.ok(updatedPayment);
    assert.equal(updatedPayment.status, "CAPTURED");
    assert.equal(updatedPayment.paymentId, paymentId);
    assert.equal(updatedPayment.registrationId, json.data.registration.id);

    // Verify verification is idempotent: Repeating verification returns confirmed state without duplicate registrations
    const repeatReq = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        orderId: orderRecord.orderId,
        paymentId,
        signature,
      }),
    });
    const repeatRes = await verifyPaymentHandler(repeatReq);
    const repeatJson = await repeatRes.json();
    assert.equal(repeatJson.success, true);
    assert.equal(repeatJson.data.registration.id, json.data.registration.id);
  });

  it("TEST CASE 2: Invalid Signature rejects payment and marks payment as FAILED", async () => {
    // 1. Create order
    const orderRecord = demoDb.createPaymentOrder({
      userId: studentUserId,
      orderId: `order_verify_invalid_${Date.now()}`,
      amountCents: 79900,
      currency: "INR",
      eventId: paidEventId,
      ticketId: paidTicketId,
      eventTitle: "Algorithmic Trading & FinTech Symposium",
    });

    const paymentId = `pay_fake_${Date.now()}`;
    const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";

    // 2. Submit verify request with invalid signature
    const req = new NextRequest("http://localhost:3000/api/payments/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        orderId: orderRecord.orderId,
        paymentId,
        signature: forgedSignature,
      }),
    });

    const res = await verifyPaymentHandler(req);
    assert.equal(res.status, 400);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.error, /signature verification failed/i);

    // Database verification: Payment marked as FAILED with error code
    const updatedPayment = demoDb.getPaymentByOrderId(orderRecord.orderId);
    assert.ok(updatedPayment);
    assert.equal(updatedPayment.status, "FAILED");
    assert.equal(updatedPayment.errorCode, "INVALID_SIGNATURE");
  });

  it("TEST CASE 3: Duplicate Webhook is safely ignored through idempotency tracking", async () => {
    const orderId = `order_webhook_idem_${Date.now()}`;
    const paymentId = `pay_webhook_idem_${Date.now()}`;
    const webhookEventId = `evt_test_idem_${Date.now()}`;

    // Create payment in CREATED state
    demoDb.createPaymentOrder({
      userId: studentUserId,
      orderId,
      amountCents: 49900,
      eventId: paidEventId,
      ticketId: paidTicketId,
    });

    const payload = {
      event_id: webhookEventId,
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: 49900,
            currency: "INR",
            status: "captured",
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateTestWebhookSignature(rawBody);

    // First Webhook Delivery
    const req1 = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
    });

    const res1 = await webhookHandler(req1);
    assert.equal(res1.status, 200);
    const json1 = await res1.json();
    assert.equal(json1.received, true);
    assert.equal(json1.duplicate, undefined);

    // Payment should now be captured
    const paymentAfter1 = demoDb.getPaymentByOrderId(orderId);
    assert.equal(paymentAfter1?.status, "CAPTURED");

    // Second Webhook Delivery (Duplicate Delivery)
    const req2 = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
    });

    const res2 = await webhookHandler(req2);
    assert.equal(res2.status, 200);
    const json2 = await res2.json();
    assert.equal(json2.received, true);
    assert.equal(json2.duplicate, true, "Duplicate webhook must be detected and flagged");
  });

  it("TEST CASE 4: Failed Payment Webhook marks payment status as FAILED", async () => {
    const orderId = `order_webhook_fail_${Date.now()}`;
    const paymentId = `pay_webhook_fail_${Date.now()}`;
    const webhookEventId = `evt_test_fail_${Date.now()}`;

    // Create payment in CREATED state
    demoDb.createPaymentOrder({
      userId: studentUserId,
      orderId,
      amountCents: 49900,
      eventId: paidEventId,
      ticketId: paidTicketId,
    });

    const payload = {
      event_id: webhookEventId,
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            error_code: "BAD_REQUEST_ERROR",
            error_description: "Card issuing bank declined the transaction",
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateTestWebhookSignature(rawBody);

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
    });

    const res = await webhookHandler(req);
    assert.equal(res.status, 200);

    const payment = demoDb.getPaymentByOrderId(orderId);
    assert.ok(payment);
    assert.equal(payment.status, "FAILED");
    assert.equal(payment.errorCode, "BAD_REQUEST_ERROR");
    assert.equal(payment.errorDescription, "Card issuing bank declined the transaction");
  });

  it("should handle refund.processed webhook and update payment to REFUNDED", async () => {
    const orderId = `order_webhook_refund_${Date.now()}`;
    const paymentId = `pay_webhook_refund_${Date.now()}`;
    const refundId = `rfnd_test_${Date.now()}`;
    const webhookEventId = `evt_test_refund_${Date.now()}`;

    // Create captured payment
    demoDb.createPaymentOrder({
      userId: studentUserId,
      orderId,
      amountCents: 49900,
      eventId: paidEventId,
      ticketId: paidTicketId,
    });
    demoDb.verifyAndCapturePayment({ orderId, paymentId });

    const payload = {
      event_id: webhookEventId,
      event: "refund.processed",
      payload: {
        refund: {
          entity: {
            id: refundId,
            payment_id: paymentId,
            amount: 49900,
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateTestWebhookSignature(rawBody);

    const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
    });

    const res = await webhookHandler(req);
    assert.equal(res.status, 200);

    const payment = demoDb.getPaymentByPaymentId(paymentId);
    assert.ok(payment);
    assert.equal(payment.status, "REFUNDED");
  });
});
