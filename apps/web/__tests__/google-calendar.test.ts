import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { demoDb } from "@campusos/db";
import {
  GOOGLE_CALENDAR_SCOPES,
  getGoogleAuthUrl,
  encryptRefreshToken,
  decryptRefreshToken,
  createAuthenticatedGoogleCalendarClient,
  listUpcomingCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  addCampusEventToGoogleCalendar,
  mapGoogleCalendarError,
} from "@campusos/integrations";
import { GET as getAuthUrlHandler } from "../app/api/google/oauth/auth-url/route";
import { POST as callbackHandler } from "../app/api/google/oauth/callback/route";
import { GET as statusHandler } from "../app/api/google/calendar/status/route";
import { GET as getEventsHandler, POST as createEventHandler } from "../app/api/google/calendar/events/route";
import { PATCH as updateEventHandler, DELETE as deleteEventHandler } from "../app/api/google/calendar/events/[id]/route";

describe("Google Calendar Integration - OAuth & Token Encryption Security", () => {
  const testRefreshToken = "1//04test_refresh_token_very_long_string_abc123xyz";

  it("should use narrowest practical OAuth scope for calendar events", () => {
    assert.ok(
      GOOGLE_CALENDAR_SCOPES.includes("https://www.googleapis.com/auth/calendar.events"),
      "Must use narrow calendar.events scope"
    );
    assert.equal(
      GOOGLE_CALENDAR_SCOPES.includes("https://www.googleapis.com/auth/calendar"),
      false,
      "Must NOT use broad full calendar root scope"
    );
  });

  it("should generate valid authorization URL containing narrow scope and offline access", () => {
    const authUrl = getGoogleAuthUrl("state_test_xyz");
    assert.ok(authUrl.includes("https://accounts.google.com/o/oauth2/v2/auth"));
    assert.ok(authUrl.includes("access_type=offline"), "Must request offline access for refresh token");
    assert.ok(authUrl.includes("prompt=consent"), "Must prompt consent to guarantee refresh token");
    assert.ok(authUrl.includes("calendar.events"), "Must specify calendar.events scope");
  });

  it("should securely encrypt and decrypt refresh token using AES-256-GCM authenticated cipher", () => {
    const encrypted = encryptRefreshToken(testRefreshToken);
    assert.notEqual(encrypted, testRefreshToken);
    assert.ok(encrypted.includes(":"), "Format must include iv, tag, and ciphertext separated by colons");

    // Decrypt
    const decrypted = decryptRefreshToken(encrypted);
    assert.equal(decrypted, testRefreshToken);

    // Two encryptions of the same token must produce different ciphertexts due to random IV (nonce)
    const encrypted2 = encryptRefreshToken(testRefreshToken);
    assert.notEqual(encrypted, encrypted2, "Must use unique IVs for each encryption");
  });

  it("should reject tampered encrypted token payload", () => {
    const encrypted = encryptRefreshToken(testRefreshToken);
    const [iv, tag, cipher] = encrypted.split(":");
    const tamperedCipher = cipher.slice(0, -2) + "00";
    const tamperedPayload = `${iv}:${tag}:${tamperedCipher}`;

    assert.throws(() => {
      decryptRefreshToken(tamperedPayload);
    }, /auth|unsupported|bad/i);
  });
});

describe("Google Calendar Integration - Endpoints & Features", () => {
  const studentUserId = "a1111111-1111-4111-8111-111111111111";
  const studentEmail = "student@campusos.edu";

  beforeEach(() => {
    // Reset connection for test isolation
    demoDb.deleteGoogleConnection(studentUserId);
  });

  it("should return disconnected state when Google Calendar is not connected", async () => {
    // 1. Check status endpoint
    const statusReq = new NextRequest("http://localhost:3000/api/google/calendar/status", {
      headers: { "x-test-user-id": studentUserId },
    });
    const statusRes = await statusHandler(statusReq);
    const statusJson = await statusRes.json();
    assert.equal(statusJson.connected, false);

    // 2. Calling GET /api/google/calendar/events returns 404 disconnected error state
    const eventsReq = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });
    const eventsRes = await getEventsHandler(eventsReq);
    assert.equal(eventsRes.status, 404);
    const eventsJson = await eventsRes.json();
    assert.equal(eventsJson.error, "disconnected");
    assert.match(eventsJson.message, /not connected/i);
  });

  it("should exchange authorization code for tokens, securely store encrypted refresh token, and never expose it", async () => {
    const callbackReq = new NextRequest("http://localhost:3000/api/google/oauth/callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        code: `test_code_${Date.now()}`,
      }),
    });

    const res = await callbackHandler(callbackReq);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.connected, true);

    // CRITICAL SECURITY CHECK: Refresh tokens must NEVER be exposed to the browser
    assert.equal(json.data.refreshToken, undefined);
    assert.equal(json.data.refresh_token, undefined);
    assert.equal(json.data.encryptedRefreshToken, undefined);

    // Database verification: Connection exists with encrypted refresh token
    const dbConn = demoDb.getGoogleConnection(studentUserId);
    assert.ok(dbConn);
    assert.ok(dbConn.encryptedRefreshToken);
    assert.notEqual(dbConn.encryptedRefreshToken, "mock_rt_"); // Encrypted!
    assert.equal(decryptRefreshToken(dbConn.encryptedRefreshToken).startsWith("mock_rt_"), true);
  });

  it("should show upcoming calendar events", async () => {
    // Setup connected user
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken(`mock_rt_${Date.now()}`),
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    });

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });
    const res = await getEventsHandler(req);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length > 0, "Must list upcoming events");
    assert.ok(json.data[0].title);
    assert.ok(json.data[0].startTime);
  });

  it("should create, update, and delete calendar event", async () => {
    // Setup connected user
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken(`mock_rt_${Date.now()}`),
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    });

    // 1. Create event (POST)
    const createReq = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        title: "Study Group: Distributed Algorithms",
        description: "Reviewing Raft consensus papers in Turing Hall",
        location: "CS Study Room 4",
        startTime: "2026-10-10T14:00:00Z",
        endTime: "2026-10-10T16:00:00Z",
      }),
    });

    const createRes = await createEventHandler(createReq);
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    assert.equal(createJson.data.title, "Study Group: Distributed Algorithms");
    const eventId = createJson.data.id;
    assert.ok(eventId);

    // Local mirror check
    const localEvent = demoDb.getCalendarEventByGoogleId(studentUserId, eventId);
    assert.ok(localEvent);
    assert.equal(localEvent.title, "Study Group: Distributed Algorithms");

    // 2. Update event (PATCH)
    const patchReq = new NextRequest(`http://localhost:3000/api/google/calendar/events/${eventId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        title: "Study Group: Distributed Algorithms (Updated to Room 5)",
        location: "CS Study Room 5",
      }),
    });

    const patchRes = await updateEventHandler(patchReq, { params: Promise.resolve({ id: eventId }) });
    assert.equal(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.equal(patchJson.success, true);
    assert.equal(patchJson.data.title, "Study Group: Distributed Algorithms (Updated to Room 5)");
    assert.equal(patchJson.data.location, "CS Study Room 5");

    // 3. Delete event (DELETE)
    const deleteReq = new NextRequest(`http://localhost:3000/api/google/calendar/events/${eventId}`, {
      method: "DELETE",
      headers: { "x-test-user-id": studentUserId },
    });

    const deleteRes = await deleteEventHandler(deleteReq, { params: Promise.resolve({ id: eventId }) });
    assert.equal(deleteRes.status, 200);
    const deleteJson = await deleteRes.json();
    assert.equal(deleteJson.success, true);

    // Verify local mirror was cleaned up
    const deletedLocal = demoDb.getCalendarEventByGoogleId(studentUserId, eventId);
    assert.equal(deletedLocal, undefined);
  });

  it("should add a CampusOS event to Google Calendar", async () => {
    // Setup connected user
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken(`mock_rt_${Date.now()}`),
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    });

    const campusEvent = demoDb.getEventBySlug("campushack-2026");
    assert.ok(campusEvent);

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user-id": studentUserId,
      },
      body: JSON.stringify({
        campusEventId: campusEvent.id,
      }),
    });

    const res = await createEventHandler(req);
    assert.equal(res.status, 201);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.title.includes("CampusHack 2026"));
    assert.equal(json.data.location, campusEvent.venue);

    // Verify mirrored in calendar_events table
    const mirrored = demoDb.getCalendarEvents(studentUserId);
    const foundMirror = mirrored.find((m) => m.eventId === campusEvent.id);
    assert.ok(foundMirror);
    assert.equal(foundMirror.eventId, campusEvent.id);
    assert.equal(foundMirror.isSynced, true);
  });
});

describe("Google Calendar Integration - Error States Verification", () => {
  const studentUserId = "a1111111-1111-4111-8111-111111111111";
  const studentEmail = "student@campusos.edu";

  it("ERROR STATE 1: disconnected", async () => {
    demoDb.deleteGoogleConnection(studentUserId);

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });

    const res = await getEventsHandler(req);
    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.error, "disconnected");
  });

  it("ERROR STATE 2: expired token", async () => {
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken("test_expired_token"),
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    });

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });

    const res = await getEventsHandler(req);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.error, "expired_token");
    assert.match(json.message, /expired/i);
  });

  it("ERROR STATE 3: revoked consent", async () => {
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken("test_revoked_consent"),
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    });

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });

    const res = await getEventsHandler(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error, "revoked_consent");
    assert.match(json.message, /revoked/i);
  });

  it("ERROR STATE 4: API quota exceeded", async () => {
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken("test_api_quota"),
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    });

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });

    const res = await getEventsHandler(req);
    assert.equal(res.status, 429);
    const json = await res.json();
    assert.equal(json.error, "api_quota");
    assert.match(json.message, /quota/i);
  });

  it("ERROR STATE 5: insufficient scope", async () => {
    demoDb.upsertGoogleConnection({
      userId: studentUserId,
      googleUserId: "google_12345",
      email: studentEmail,
      encryptedRefreshToken: encryptRefreshToken("test_insufficient_scope"),
      scope: "https://www.googleapis.com/auth/calendar.readonly",
    });

    const req = new NextRequest("http://localhost:3000/api/google/calendar/events", {
      headers: { "x-test-user-id": studentUserId },
    });

    const res = await getEventsHandler(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error, "insufficient_scope");
    assert.match(json.message, /permission|scope/i);
  });
});
