import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { demoDb } from "@campusos/db";
import {
  GOOGLE_GMAIL_SCOPES,
  getGmailAuthUrl,
  getGmailService,
  DemoGmailService,
  GoogleGmailService,
  createAuthenticatedGmailClient,
  mapGmailError,
  validateRecipient,
  getDemoSentEmails,
  clearDemoSentEmails,
  encryptRefreshToken,
} from "@campusos/integrations";
import { POST as previewHandler } from "../app/api/google/gmail/preview/route";
import { POST as sendHandler } from "../app/api/google/gmail/send/route";
import { GET as statusHandler } from "../app/api/google/gmail/status/route";
import { GET as authUrlHandler } from "../app/api/google/gmail/auth-url/route";
import { GET as historyHandler } from "../app/api/google/gmail/history/route";
import { POST as callbackHandler } from "../app/api/google/oauth/callback/route";

const TEST_STUDENT_ID = "a1111111-1111-4111-8111-111111111111";

function makeRequest(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): NextRequest {
  const headers: Record<string, string> = {
    "x-test-user-id": TEST_STUDENT_ID,
    ...options.headers,
  };
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options.method,
    headers,
    body: options.body,
  });
}

describe("Gmail Integration - OAuth Scopes & Security", () => {
  it("should use narrowest practical OAuth scope (gmail.send) and NOT broad gmail scopes", () => {
    assert.ok(
      GOOGLE_GMAIL_SCOPES.includes("https://www.googleapis.com/auth/gmail.send"),
      "Must include gmail.send scope"
    );
    // Must NEVER request read, modify, or full access
    assert.equal(
      GOOGLE_GMAIL_SCOPES.includes("https://www.googleapis.com/auth/gmail.readonly"),
      false,
      "Must NOT request gmail.readonly"
    );
    assert.equal(
      GOOGLE_GMAIL_SCOPES.includes("https://www.googleapis.com/auth/gmail.modify"),
      false,
      "Must NOT request gmail.modify"
    );
    assert.equal(
      GOOGLE_GMAIL_SCOPES.includes("https://mail.google.com/"),
      false,
      "Must NOT request full mailbox access"
    );
  });

  it("should generate valid authorization URL containing gmail.send scope", () => {
    const authUrl = getGmailAuthUrl("state_gmail_123");
    assert.ok(authUrl.includes("https://accounts.google.com/o/oauth2/v2/auth"));
    assert.ok(authUrl.includes("access_type=offline"), "Must request offline access");
    assert.ok(authUrl.includes("prompt=consent"), "Must prompt consent");
    assert.ok(authUrl.includes("gmail.send"), "Must specify gmail.send scope");
  });
});

describe("GmailService Abstraction & DemoGmailService", () => {
  beforeEach(() => {
    clearDemoSentEmails();
  });

  it("should fall back to DemoGmailService when not connected", () => {
    const service = getGmailService({
      userId: TEST_STUDENT_ID,
    });
    assert.ok(service instanceof DemoGmailService);
    assert.equal(service.providerName, "demo_local");
  });

  it("should create GoogleGmailService when valid encrypted token is provided", () => {
    const encrypted = encryptRefreshToken("mock_rt_test_gmail");
    const service = getGmailService({
      encryptedRefreshToken: encrypted,
      userId: TEST_STUDENT_ID,
      userEmail: "test@campusos.edu",
    });
    assert.ok(service instanceof GoogleGmailService);
    assert.equal(service.providerName, "google_gmail");
  });

  it("should build registration confirmation email with correct template", () => {
    const service = new DemoGmailService();
    const email = service.buildRegistrationConfirmation(
      { email: "student@university.edu", name: "Test Student" },
      {
        studentName: "Test Student",
        eventTitle: "Tech Symposium 2026",
        eventDate: "2026-10-15",
        eventVenue: "Main Auditorium",
        ticketType: "General",
        registrationId: "reg-001",
        eventSlug: "tech-symposium-2026",
      }
    );
    assert.equal(email.templateType, "registration_confirmation");
    assert.ok(email.subject.includes("Tech Symposium 2026"));
    assert.ok(email.htmlBody.includes("Registration Confirmed"));
    assert.ok(email.textBody.includes("Test Student"));
    assert.ok(email.htmlBody.includes("Main Auditorium"));
  });

  it("should build payment confirmation email", () => {
    const service = new DemoGmailService();
    const email = service.buildPaymentConfirmation(
      { email: "student@university.edu" },
      {
        studentName: "Test Student",
        eventTitle: "Workshop",
        amount: "499",
        currency: "INR",
        paymentId: "pay_123",
        orderId: "order_456",
        transactionDate: "2026-09-19",
      }
    );
    assert.equal(email.templateType, "payment_confirmation");
    assert.ok(email.subject.includes("Payment Received"));
    assert.ok(email.htmlBody.includes("INR"));
    assert.ok(email.htmlBody.includes("pay_123"));
  });

  it("should build organizer notification email", () => {
    const service = new DemoGmailService();
    const email = service.buildOrganizerNotification(
      { email: "organizer@university.edu" },
      {
        organizerName: "Club Lead",
        eventTitle: "Hackathon",
        registrantName: "New Participant",
        registrantEmail: "participant@uni.edu",
        ticketType: "Premium",
        totalRegistrations: 42,
      }
    );
    assert.equal(email.templateType, "organizer_notification");
    assert.ok(email.subject.includes("New Registration"));
    assert.ok(email.htmlBody.includes("42"));
  });

  it("should build announcement email", () => {
    const service = new DemoGmailService();
    const email = service.buildAnnouncement(
      { email: "student@uni.edu", name: "Recipient" },
      {
        recipientName: "Recipient",
        title: "Important Update",
        body: "Campus closed for maintenance.",
        actionUrl: "http://localhost:3000/announcements",
        actionLabel: "View Details",
        senderName: "Admin Team",
      }
    );
    assert.equal(email.templateType, "announcement");
    assert.ok(email.htmlBody.includes("Important Update"));
    assert.ok(email.htmlBody.includes("View Details"));
  });

  it("should reject sending without confirmation", async () => {
    const service = new DemoGmailService();
    const email = service.buildAnnouncement(
      { email: "test@example.com" },
      { recipientName: "Test", title: "Test", body: "Test body" }
    );
    await assert.rejects(
      () => service.sendEmail(email, false),
      (err: any) => err.error === "send_failed" && err.statusCode === 400
    );
  });

  it("should send email successfully with confirmation and log in demo store", async () => {
    const service = new DemoGmailService();
    const email = service.buildRegistrationConfirmation(
      { email: "student@test.edu", name: "Demo Student" },
      {
        studentName: "Demo Student",
        eventTitle: "Demo Event",
        eventDate: "2026-12-01",
        eventVenue: "Virtual",
        registrationId: "reg-demo",
      }
    );
    const result = await service.sendEmail(email, true);
    assert.ok(result.messageId.startsWith("demo_msg_"));
    assert.equal(result.provider, "demo_local");
    assert.ok(result.sentAt);

    const sentEmails = getDemoSentEmails();
    assert.ok(sentEmails.length >= 1);
    assert.equal(sentEmails[sentEmails.length - 1].subject, email.subject);
  });
});

describe("Recipient Validation", () => {
  it("should accept valid email", () => {
    assert.ok(validateRecipient({ email: "user@example.com" }).valid);
  });

  it("should reject empty email", () => {
    const result = validateRecipient({ email: "" });
    assert.equal(result.valid, false);
    assert.ok(result.error!.includes("required"));
  });

  it("should reject invalid email format", () => {
    const result = validateRecipient({ email: "not-an-email" });
    assert.equal(result.valid, false);
    assert.ok(result.error!.includes("Invalid email"));
  });
});

describe("Gmail Error Mapping", () => {
  it("should map expired token errors", () => {
    const err = mapGmailError({ status: 401, message: "expired_token: Invalid Credentials" });
    assert.equal(err.error, "expired_token");
    assert.equal(err.statusCode, 401);
  });

  it("should map revoked consent errors", () => {
    const err = mapGmailError({ message: "invalid_grant: Token has been expired or revoked" });
    assert.equal(err.error, "revoked_consent");
    assert.equal(err.statusCode, 403);
  });

  it("should map quota errors", () => {
    const err = mapGmailError({ status: 429, message: "quotaExceeded" });
    assert.equal(err.error, "api_quota");
    assert.equal(err.statusCode, 429);
  });

  it("should map insufficient scope errors", () => {
    const err = mapGmailError({ message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" });
    assert.equal(err.error, "insufficient_scope");
    assert.equal(err.statusCode, 403);
  });

  it("should prevent double-mapping existing GmailError", () => {
    const existing = { error: "expired_token", message: "Already mapped", statusCode: 401 };
    const result = mapGmailError(existing);
    assert.equal(result.error, "expired_token");
    assert.equal(result.message, "Already mapped");
  });
});

describe("Gmail Error Simulation Hooks", () => {
  it("should simulate expired_token error", async () => {
    const client = createAuthenticatedGmailClient("test_expired_token");
    await assert.rejects(
      () => client.users.messages.send({ userId: "me", requestBody: { raw: "" } }),
      (err: any) => err.status === 401
    );
  });

  it("should simulate revoked_consent error", async () => {
    const client = createAuthenticatedGmailClient("test_revoked_consent");
    await assert.rejects(
      () => client.users.messages.send({ userId: "me", requestBody: { raw: "" } }),
      (err: any) => err.status === 403
    );
  });

  it("should simulate api_quota error", async () => {
    const client = createAuthenticatedGmailClient("test_api_quota");
    await assert.rejects(
      () => client.users.messages.send({ userId: "me", requestBody: { raw: "" } }),
      (err: any) => err.status === 429
    );
  });

  it("should simulate insufficient_scope error", async () => {
    const client = createAuthenticatedGmailClient("test_insufficient_scope");
    await assert.rejects(
      () => client.users.messages.send({ userId: "me", requestBody: { raw: "" } }),
      (err: any) => err.status === 403
    );
  });
});

describe("Gmail API Routes", () => {
  it("GET /api/google/gmail/status should return disconnected for user without gmail scope", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/status");
    const res = await statusHandler(req);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.connected, false);
    assert.equal(json.data.provider, "demo_local");
  });

  it("GET /api/google/gmail/auth-url should return a valid auth URL", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/auth-url");
    const res = await authUrlHandler(req);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.authUrl.includes("gmail.send"));
  });

  it("POST /api/google/gmail/preview should generate email preview", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/preview", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": TEST_STUDENT_ID,
      },
      body: JSON.stringify({
        templateType: "registration_confirmation",
        to: { email: "student@test.edu", name: "Test Student" },
        data: {
          studentName: "Test Student",
          eventTitle: "Preview Event",
          eventDate: "2026-11-01",
          eventVenue: "Room 101",
          registrationId: "reg-preview",
        },
      }),
    });
    const res = await previewHandler(req);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.htmlBody.includes("Preview Event"));
    assert.ok(json.data.estimatedSizeBytes > 0);
    assert.equal(json.data.templateType, "registration_confirmation");
  });

  it("POST /api/google/gmail/send should reject without confirmation", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": TEST_STUDENT_ID,
      },
      body: JSON.stringify({
        templateType: "announcement",
        to: { email: "recipient@test.edu" },
        data: { recipientName: "Test", title: "Hello", body: "Test body" },
        confirmed: false,
      }),
    });
    const res = await sendHandler(req);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "confirmation_required");
  });

  it("POST /api/google/gmail/send should send email with confirmation and log to audit", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": TEST_STUDENT_ID,
      },
      body: JSON.stringify({
        templateType: "payment_confirmation",
        to: { email: "student@test.edu", name: "Test Student" },
        data: {
          studentName: "Test Student",
          eventTitle: "Paid Event",
          amount: "299",
          currency: "INR",
          paymentId: "pay_test_001",
          orderId: "order_test_001",
          transactionDate: "2026-09-19",
        },
        confirmed: true,
      }),
    });
    const res = await sendHandler(req);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.messageId);
    assert.ok(json.data.sentAt);

    // Verify it was logged in the database
    const messages = demoDb.getGmailMessages(TEST_STUDENT_ID);
    assert.ok(messages.length >= 1);
    const lastMsg = messages[0];
    assert.equal(lastMsg.toEmail, "student@test.edu");
    assert.equal(lastMsg.templateType, "payment_confirmation");
  });

  it("POST /api/google/gmail/send should reject invalid recipient", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": TEST_STUDENT_ID,
      },
      body: JSON.stringify({
        templateType: "announcement",
        to: { email: "invalid-email" },
        data: { recipientName: "Test", title: "Hello", body: "Test body" },
        confirmed: true,
      }),
    });
    const res = await sendHandler(req);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "invalid_recipient");
  });

  it("GET /api/google/gmail/history should return sent email records", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/history");
    const res = await historyHandler(req);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
  });

  it("POST /api/google/gmail/preview should reject missing recipient", async () => {
    const req = makeRequest("http://localhost:3000/api/google/gmail/preview", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": TEST_STUDENT_ID,
      },
      body: JSON.stringify({
        templateType: "announcement",
        to: {},
        data: { recipientName: "Test", title: "Hello", body: "Test" },
      }),
    });
    const res = await previewHandler(req);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  it("OAuth callback should handle gmail type and set gmail.send scope", async () => {
    const state = Buffer.from(
      JSON.stringify({ userId: TEST_STUDENT_ID, type: "gmail", timestamp: Date.now() })
    ).toString("base64url");

    const req = makeRequest(
      `http://localhost:3000/api/google/oauth/callback?code=test_code_gmail_001&state=${state}`,
      {
        headers: {
          accept: "application/json",
          "x-test-user-id": TEST_STUDENT_ID,
        },
      }
    );
    // Use GET handler for the callback
    const { GET } = await import("../app/api/google/oauth/callback/route");
    const res = await GET(req);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.message.includes("Gmail"));
    assert.ok(json.data.scope.includes("gmail.send"));
  });
});
