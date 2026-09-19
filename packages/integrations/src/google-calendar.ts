import crypto from "crypto";
import { google, calendar_v3 } from "googleapis";

/**
 * Narrowest practical OAuth scope for Google Calendar event management
 * without requesting full account or root calendar administration permissions.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];

export type GoogleCalendarErrorCode =
  | "disconnected"
  | "expired_token"
  | "revoked_consent"
  | "api_quota"
  | "insufficient_scope"
  | "unknown_error";

export interface GoogleCalendarError {
  error: GoogleCalendarErrorCode;
  message: string;
  statusCode: number;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  htmlLink?: string;
  isCampusOSEvent?: boolean;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

// Derive a 32-byte key for AES-256-GCM encryption
function getEncryptionKey(): Buffer {
  const secret =
    process.env.GOOGLE_ENCRYPTION_KEY ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "campusos_default_fallback_encryption_secret_key_2026";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts refresh token using AES-256-GCM authenticated cipher with random IV.
 * Format: `ivHex:authTagHex:encryptedHex`
 * Never expose refresh tokens in plaintext to the browser!
 */
export function encryptRefreshToken(token: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted refresh token payload.
 */
export function decryptRefreshToken(encryptedPayload: string): string {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Creates an OAuth2 client configured with application credentials.
 */
export function getGoogleOAuth2Client(): InstanceType<typeof google.auth.OAuth2> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "mock-google-client-id";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/oauth/callback";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates OAuth authorization consent URL with narrowest practical scope.
 */
export function getGoogleAuthUrl(state?: string): string {
  const oauth2Client = getGoogleOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Guarantees a refresh_token is returned
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
  });
}

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  refreshToken: string;
  accessToken: string;
  expiryDate?: number;
  email: string;
  googleUserId: string;
  scope: string;
}> {
  // If in mock or test environment with simulated code
  if (code.startsWith("test_code_") || !process.env.GOOGLE_CLIENT_SECRET) {
    const mockGoogleUserId = `google_user_${Date.now()}`;
    const mockEmail = `student.${Date.now().toString().slice(-4)}@campusos.edu`;
    return {
      refreshToken: `mock_rt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      accessToken: `mock_at_${Date.now()}`,
      expiryDate: Date.now() + 3600 * 1000,
      email: mockEmail,
      googleUserId: mockGoogleUserId,
      scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    };
  }

  const oauth2Client = getGoogleOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error("No refresh token provided by Google. Ensure prompt=consent is requested.");
  }

  oauth2Client.setCredentials(tokens);

  // Retrieve user identity (email & sub)
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token || "",
    expiryDate: tokens.expiry_date ?? undefined,
    email: userInfo.data.email || "user@campusos.edu",
    googleUserId: userInfo.data.id || `google_${Date.now()}`,
    scope: tokens.scope || GOOGLE_CALENDAR_SCOPES.join(" "),
  };
}

/**
 * Maps Google API exceptions to standard CampusOS error states:
 * - disconnected
 * - expired token
 * - revoked consent
 * - API quota
 * - insufficient scope
 */
export function mapGoogleCalendarError(err: any): GoogleCalendarError {
  const message = err?.message || String(err);
  const status = err?.status || err?.code || 500;

  // 1. Revoked consent or invalid grant
  if (
    message.includes("invalid_grant") ||
    message.includes("revoked") ||
    message.includes("unauthorized_client") ||
    message.includes("Token has been expired or revoked")
  ) {
    return {
      error: "revoked_consent",
      message: "Google Calendar authorization has been revoked or expired. Please reconnect your account.",
      statusCode: 403,
    };
  }

  // 2. Expired token
  if (message.includes("expired_token") || message.includes("Invalid Credentials") || status === 401) {
    return {
      error: "expired_token",
      message: "Google access token has expired and could not be renewed.",
      statusCode: 401,
    };
  }

  // 3. Insufficient scope
  if (
    message.includes("insufficient") ||
    message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
    message.includes("Insufficient Permission")
  ) {
    return {
      error: "insufficient_scope",
      message: "Insufficient permissions granted. Please grant calendar event management permissions.",
      statusCode: 403,
    };
  }

  // 4. API quota / Rate limits
  if (
    status === 429 ||
    message.includes("quotaExceeded") ||
    message.includes("rateLimitExceeded") ||
    message.includes("userRateLimitExceeded")
  ) {
    return {
      error: "api_quota",
      message: "Google Calendar API rate limit or quota exceeded. Please try again later.",
      statusCode: 429,
    };
  }

  // 5. Disconnected
  if (message.includes("disconnected") || message.includes("not connected")) {
    return {
      error: "disconnected",
      message: "Google account is not connected. Please authorize Google Calendar.",
      statusCode: 404,
    };
  }

  return {
    error: "unknown_error",
    message: message || "An unexpected error occurred while communicating with Google Calendar.",
    statusCode: typeof status === "number" && status >= 400 && status < 600 ? status : 500,
  };
}

// In-memory store for mock events in test/sandbox mode
const mockCalendarStore = new Map<string, CalendarEventItem[]>();

/**
 * Creates an authenticated Google Calendar API client using decrypted refresh token.
 * Automatically delegates to Mock Calendar sandbox when running with mock test tokens.
 */
export function createAuthenticatedGoogleCalendarClient(
  decryptedRefreshToken: string
): calendar_v3.Calendar {
  // Test error simulation hooks
  if (decryptedRefreshToken === "test_expired_token") {
    return {
      events: {
        list: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        insert: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        patch: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        delete: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_revoked_consent") {
    return {
      events: {
        list: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        insert: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        patch: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        delete: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_api_quota") {
    return {
      events: {
        list: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        insert: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        patch: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        delete: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_insufficient_scope") {
    return {
      events: {
        list: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        insert: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        patch: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        delete: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
      },
    } as any;
  }

  // Sandbox / Mock token handler
  if (decryptedRefreshToken.startsWith("mock_rt_") || !process.env.GOOGLE_CLIENT_SECRET) {
    if (!mockCalendarStore.has(decryptedRefreshToken)) {
      mockCalendarStore.set(decryptedRefreshToken, [
        {
          id: "g_evt_cs601_lecture",
          title: "CS601 Distributed Systems Lecture",
          description: "Paxos, Raft consensus, and vector clocks discussion.",
          location: "Alan Turing CS Hall 101",
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 90000000).toISOString(),
          htmlLink: "https://calendar.google.com/calendar/event?eid=mock1",
        },
      ]);
    }

    return {
      events: {
        list: async (params: any) => {
          const events = mockCalendarStore.get(decryptedRefreshToken) || [];
          return {
            data: {
              items: events.map((e) => ({
                id: e.id,
                summary: e.title,
                description: e.description,
                location: e.location,
                start: { dateTime: e.startTime },
                end: { dateTime: e.endTime },
                htmlLink: e.htmlLink,
              })),
            },
          };
        },
        insert: async (params: any) => {
          const body = params.requestBody || {};
          const newEvt: CalendarEventItem = {
            id: `g_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: body.summary || "Untitled Event",
            description: body.description,
            location: body.location,
            startTime: body.start?.dateTime || new Date().toISOString(),
            endTime: body.end?.dateTime || new Date(Date.now() + 3600000).toISOString(),
            htmlLink: `https://calendar.google.com/calendar/event?eid=${Date.now()}`,
          };
          const list = mockCalendarStore.get(decryptedRefreshToken) || [];
          list.push(newEvt);
          mockCalendarStore.set(decryptedRefreshToken, list);
          return {
            data: {
              id: newEvt.id,
              summary: newEvt.title,
              description: newEvt.description,
              location: newEvt.location,
              start: { dateTime: newEvt.startTime },
              end: { dateTime: newEvt.endTime },
              htmlLink: newEvt.htmlLink,
            },
          };
        },
        patch: async (params: any) => {
          const list = mockCalendarStore.get(decryptedRefreshToken) || [];
          const existing = list.find((e) => e.id === params.eventId);
          if (!existing) {
            throw { status: 404, message: "Not Found" };
          }
          const body = params.requestBody || {};
          if (body.summary) existing.title = body.summary;
          if (body.description !== undefined) existing.description = body.description;
          if (body.location !== undefined) existing.location = body.location;
          if (body.start?.dateTime) existing.startTime = body.start.dateTime;
          if (body.end?.dateTime) existing.endTime = body.end.dateTime;
          return {
            data: {
              id: existing.id,
              summary: existing.title,
              description: existing.description,
              location: existing.location,
              start: { dateTime: existing.startTime },
              end: { dateTime: existing.endTime },
              htmlLink: existing.htmlLink,
            },
          };
        },
        delete: async (params: any) => {
          const list = mockCalendarStore.get(decryptedRefreshToken) || [];
          const idx = list.findIndex((e) => e.id === params.eventId);
          if (idx >= 0) list.splice(idx, 1);
          return { data: {} };
        },
      },
    } as any;
  }

  // Live Google Calendar API
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: decryptedRefreshToken,
  });

  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
}

/**
 * Lists upcoming calendar events.
 */
export async function listUpcomingCalendarEvents(
  client: calendar_v3.Calendar,
  options?: { maxResults?: number; timeMin?: string }
): Promise<CalendarEventItem[]> {
  try {
    const res = await client.events.list({
      calendarId: "primary",
      timeMin: options?.timeMin || new Date().toISOString(),
      maxResults: options?.maxResults || 20,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = res.data.items || [];
    return items.map((item) => ({
      id: item.id || "",
      title: item.summary || "(No Title)",
      description: item.description ?? undefined,
      location: item.location ?? undefined,
      startTime: item.start?.dateTime || item.start?.date || "",
      endTime: item.end?.dateTime || item.end?.date || "",
      htmlLink: item.htmlLink ?? undefined,
      isCampusOSEvent: item.description?.includes("CampusOS") || false,
    }));
  } catch (err: any) {
    throw mapGoogleCalendarError(err);
  }
}

/**
 * Creates a new event in the user's primary calendar.
 */
export async function createGoogleCalendarEvent(
  client: calendar_v3.Calendar,
  event: CalendarEventInput
): Promise<CalendarEventItem> {
  try {
    const res = await client.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: { dateTime: event.startTime },
        end: { dateTime: event.endTime },
      },
    });

    const item = res.data;
    return {
      id: item.id || "",
      title: item.summary || event.title,
      description: item.description ?? undefined,
      location: item.location ?? undefined,
      startTime: item.start?.dateTime || event.startTime,
      endTime: item.end?.dateTime || event.endTime,
      htmlLink: item.htmlLink ?? undefined,
      isCampusOSEvent: true,
    };
  } catch (err: any) {
    throw mapGoogleCalendarError(err);
  }
}

/**
 * Updates an existing calendar event.
 */
export async function updateGoogleCalendarEvent(
  client: calendar_v3.Calendar,
  eventId: string,
  updates: Partial<CalendarEventInput>
): Promise<CalendarEventItem> {
  try {
    const res = await client.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: {
        ...(updates.title && { summary: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.startTime && { start: { dateTime: updates.startTime } }),
        ...(updates.endTime && { end: { dateTime: updates.endTime } }),
      },
    });

    const item = res.data;
    return {
      id: item.id || eventId,
      title: item.summary || updates.title || "",
      description: item.description ?? undefined,
      location: item.location ?? undefined,
      startTime: item.start?.dateTime || updates.startTime || "",
      endTime: item.end?.dateTime || updates.endTime || "",
      htmlLink: item.htmlLink ?? undefined,
      isCampusOSEvent: item.description?.includes("CampusOS") || false,
    };
  } catch (err: any) {
    throw mapGoogleCalendarError(err);
  }
}

/**
 * Deletes an event from the user's primary calendar.
 */
export async function deleteGoogleCalendarEvent(
  client: calendar_v3.Calendar,
  eventId: string
): Promise<void> {
  try {
    await client.events.delete({
      calendarId: "primary",
      eventId,
    });
  } catch (err: any) {
    throw mapGoogleCalendarError(err);
  }
}

/**
 * Adds a CampusOS University event directly to Google Calendar.
 */
export async function addCampusEventToGoogleCalendar(
  client: calendar_v3.Calendar,
  campusEvent: {
    title: string;
    description?: string;
    venue: string;
    startTime: string;
    endTime: string;
    slug?: string;
  }
): Promise<CalendarEventItem> {
  const description = [
    campusEvent.description,
    "",
    `Official Campus Event recorded on CampusOS University Operating System.`,
    campusEvent.slug ? `Event Portal: http://localhost:3000/events/${campusEvent.slug}` : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return createGoogleCalendarEvent(client, {
    title: `[CampusOS] ${campusEvent.title}`,
    description,
    location: campusEvent.venue,
    startTime: campusEvent.startTime,
    endTime: campusEvent.endTime,
  });
}
