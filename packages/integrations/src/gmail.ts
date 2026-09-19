import { google, gmail_v1 } from "googleapis";
import {
  getGoogleOAuth2Client,
  decryptRefreshToken,
  getEncryptionKey,
} from "./google-calendar";

/**
 * Narrowest practical OAuth scope for sending Gmail messages.
 * NEVER request read, modify, or full mailbox access.
 * gmail.send only allows composing and sending new messages.
 */
export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "email",
  "profile",
];

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type GmailErrorCode =
  | "disconnected"
  | "expired_token"
  | "revoked_consent"
  | "api_quota"
  | "insufficient_scope"
  | "invalid_recipient"
  | "send_failed"
  | "unknown_error";

export interface GmailError {
  error: GmailErrorCode;
  message: string;
  statusCode: number;
}

// ---------------------------------------------------------------------------
// Email types
// ---------------------------------------------------------------------------

export type EmailTemplateType =
  | "registration_confirmation"
  | "payment_confirmation"
  | "organizer_notification"
  | "announcement";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailRecipient;
  subject: string;
  htmlBody: string;
  textBody: string;
  templateType: EmailTemplateType;
  /** Metadata for audit logging */
  metadata?: Record<string, any>;
}

export interface EmailPreview {
  to: EmailRecipient;
  subject: string;
  htmlBody: string;
  textBody: string;
  templateType: EmailTemplateType;
  estimatedSizeBytes: number;
}

export interface EmailSendResult {
  messageId: string;
  threadId?: string;
  sentAt: string;
  provider: "google_gmail" | "demo_local";
}

// ---------------------------------------------------------------------------
// Email template data types
// ---------------------------------------------------------------------------

export interface RegistrationConfirmationData {
  studentName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketType?: string;
  registrationId: string;
  eventSlug?: string;
}

export interface PaymentConfirmationData {
  studentName: string;
  eventTitle: string;
  amount: string;
  currency: string;
  paymentId: string;
  orderId: string;
  transactionDate: string;
}

export interface OrganizerNotificationData {
  organizerName: string;
  eventTitle: string;
  registrantName: string;
  registrantEmail: string;
  ticketType?: string;
  totalRegistrations: number;
}

export interface AnnouncementData {
  recipientName: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  senderName?: string;
}

// ---------------------------------------------------------------------------
// GmailService Interface (abstraction)
// ---------------------------------------------------------------------------

/**
 * Abstraction over Gmail send functionality.
 * Implementations:
 *  - DemoGmailService: logs to in-memory store, never sends real emails
 *  - GoogleGmailService: uses Gmail API v1 with gmail.send scope
 */
export interface GmailService {
  readonly providerName: "google_gmail" | "demo_local";

  /**
   * Generate a preview of what the email will look like without sending it.
   * Used for the "show email preview" requirement.
   */
  previewEmail(message: EmailMessage): Promise<EmailPreview>;

  /**
   * Send an email. Requires a confirmation flag for user-triggered messages.
   * @param message The email to send
   * @param confirmed Whether the user has explicitly confirmed sending
   */
  sendEmail(message: EmailMessage, confirmed: boolean): Promise<EmailSendResult>;

  /**
   * Generate a registration confirmation email from structured data.
   */
  buildRegistrationConfirmation(
    to: EmailRecipient,
    data: RegistrationConfirmationData
  ): EmailMessage;

  /**
   * Generate a payment confirmation email from structured data.
   */
  buildPaymentConfirmation(
    to: EmailRecipient,
    data: PaymentConfirmationData
  ): EmailMessage;

  /**
   * Generate an organizer notification email from structured data.
   */
  buildOrganizerNotification(
    to: EmailRecipient,
    data: OrganizerNotificationData
  ): EmailMessage;

  /**
   * Generate an announcement email from structured data.
   */
  buildAnnouncement(
    to: EmailRecipient,
    data: AnnouncementData
  ): EmailMessage;
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRecipient(recipient: EmailRecipient): { valid: boolean; error?: string } {
  if (!recipient.email) {
    return { valid: false, error: "Recipient email is required." };
  }
  if (!EMAIL_REGEX.test(recipient.email)) {
    return { valid: false, error: `Invalid email address: ${recipient.email}` };
  }
  // Block obvious test/invalid domains in production
  const domain = recipient.email.split("@")[1]?.toLowerCase();
  if (!domain || domain.length < 3) {
    return { valid: false, error: `Invalid email domain: ${domain}` };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Email templates (shared between Demo and Google implementations)
// ---------------------------------------------------------------------------

function campusOSEmailWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #18181b; padding: 24px 32px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; }
    .header .subtitle { color: #a1a1aa; font-size: 13px; margin-top: 4px; }
    .body { padding: 32px; color: #27272a; line-height: 1.6; }
    .body h2 { color: #18181b; font-size: 18px; margin-top: 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f4f4f5; }
    .detail-label { font-weight: 600; min-width: 140px; color: #52525b; }
    .detail-value { color: #18181b; }
    .cta-button { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 16px; }
    .footer { background: #f4f4f5; padding: 20px 32px; text-align: center; color: #71717a; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CampusOS</h1>
      <div class="subtitle">University Operating System</div>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>This is an automated message from CampusOS. Please do not reply directly.</p>
      <p>&copy; ${new Date().getFullYear()} CampusOS University Operating System</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildRegistrationConfirmationEmail(
  to: EmailRecipient,
  data: RegistrationConfirmationData
): EmailMessage {
  const subject = `Registration Confirmed: ${data.eventTitle}`;
  const bodyHtml = `
    <h2>Registration Confirmed! 🎉</h2>
    <p>Hi ${escapeHtml(data.studentName)},</p>
    <p>Your registration for <strong>${escapeHtml(data.eventTitle)}</strong> has been confirmed.</p>
    <div class="detail-row"><span class="detail-label">Event</span><span class="detail-value">${escapeHtml(data.eventTitle)}</span></div>
    <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${escapeHtml(data.eventDate)}</span></div>
    <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${escapeHtml(data.eventVenue)}</span></div>
    ${data.ticketType ? `<div class="detail-row"><span class="detail-label">Ticket</span><span class="detail-value">${escapeHtml(data.ticketType)}</span></div>` : ""}
    <div class="detail-row"><span class="detail-label">Registration ID</span><span class="detail-value">${escapeHtml(data.registrationId)}</span></div>
    ${data.eventSlug ? `<a href="http://localhost:3000/events/${escapeHtml(data.eventSlug)}" class="cta-button">View Event Details</a>` : ""}
    <p style="margin-top: 24px; color: #52525b;">See you there! 🚀</p>
  `;
  const htmlBody = campusOSEmailWrapper(subject, bodyHtml);
  const textBody = [
    `Registration Confirmed: ${data.eventTitle}`,
    "",
    `Hi ${data.studentName},`,
    "",
    `Your registration for "${data.eventTitle}" has been confirmed.`,
    "",
    `Event: ${data.eventTitle}`,
    `Date: ${data.eventDate}`,
    `Venue: ${data.eventVenue}`,
    data.ticketType ? `Ticket: ${data.ticketType}` : "",
    `Registration ID: ${data.registrationId}`,
    "",
    "See you there!",
    "",
    "— CampusOS University Operating System",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject,
    htmlBody,
    textBody,
    templateType: "registration_confirmation",
    metadata: {
      eventTitle: data.eventTitle,
      registrationId: data.registrationId,
    },
  };
}

function buildPaymentConfirmationEmail(
  to: EmailRecipient,
  data: PaymentConfirmationData
): EmailMessage {
  const subject = `Payment Received: ${data.eventTitle}`;
  const bodyHtml = `
    <h2>Payment Confirmed ✅</h2>
    <p>Hi ${escapeHtml(data.studentName)},</p>
    <p>Your payment for <strong>${escapeHtml(data.eventTitle)}</strong> has been successfully processed.</p>
    <div class="detail-row"><span class="detail-label">Event</span><span class="detail-value">${escapeHtml(data.eventTitle)}</span></div>
    <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">${escapeHtml(data.currency)} ${escapeHtml(data.amount)}</span></div>
    <div class="detail-row"><span class="detail-label">Payment ID</span><span class="detail-value">${escapeHtml(data.paymentId)}</span></div>
    <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${escapeHtml(data.orderId)}</span></div>
    <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${escapeHtml(data.transactionDate)}</span></div>
    <p style="margin-top: 24px; color: #52525b;">Please keep this email for your records.</p>
  `;
  const htmlBody = campusOSEmailWrapper(subject, bodyHtml);
  const textBody = [
    `Payment Received: ${data.eventTitle}`,
    "",
    `Hi ${data.studentName},`,
    "",
    `Your payment for "${data.eventTitle}" has been successfully processed.`,
    "",
    `Amount: ${data.currency} ${data.amount}`,
    `Payment ID: ${data.paymentId}`,
    `Order ID: ${data.orderId}`,
    `Date: ${data.transactionDate}`,
    "",
    "Please keep this email for your records.",
    "",
    "— CampusOS University Operating System",
  ].join("\n");

  return {
    to,
    subject,
    htmlBody,
    textBody,
    templateType: "payment_confirmation",
    metadata: {
      paymentId: data.paymentId,
      orderId: data.orderId,
      amount: data.amount,
    },
  };
}

function buildOrganizerNotificationEmail(
  to: EmailRecipient,
  data: OrganizerNotificationData
): EmailMessage {
  const subject = `New Registration: ${data.eventTitle}`;
  const bodyHtml = `
    <h2>New Registration 📋</h2>
    <p>Hi ${escapeHtml(data.organizerName)},</p>
    <p>A new participant has registered for <strong>${escapeHtml(data.eventTitle)}</strong>.</p>
    <div class="detail-row"><span class="detail-label">Registrant</span><span class="detail-value">${escapeHtml(data.registrantName)}</span></div>
    <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(data.registrantEmail)}</span></div>
    ${data.ticketType ? `<div class="detail-row"><span class="detail-label">Ticket</span><span class="detail-value">${escapeHtml(data.ticketType)}</span></div>` : ""}
    <div class="detail-row"><span class="detail-label">Total Registrations</span><span class="detail-value">${data.totalRegistrations}</span></div>
  `;
  const htmlBody = campusOSEmailWrapper(subject, bodyHtml);
  const textBody = [
    `New Registration: ${data.eventTitle}`,
    "",
    `Hi ${data.organizerName},`,
    "",
    `A new participant has registered for "${data.eventTitle}".`,
    "",
    `Registrant: ${data.registrantName}`,
    `Email: ${data.registrantEmail}`,
    data.ticketType ? `Ticket: ${data.ticketType}` : "",
    `Total Registrations: ${data.totalRegistrations}`,
    "",
    "— CampusOS University Operating System",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject,
    htmlBody,
    textBody,
    templateType: "organizer_notification",
    metadata: {
      eventTitle: data.eventTitle,
      registrantEmail: data.registrantEmail,
      totalRegistrations: data.totalRegistrations,
    },
  };
}

function buildAnnouncementEmail(
  to: EmailRecipient,
  data: AnnouncementData
): EmailMessage {
  const subject = data.title;
  const bodyHtml = `
    <h2>${escapeHtml(data.title)}</h2>
    <p>Hi ${escapeHtml(data.recipientName)},</p>
    <p>${escapeHtml(data.body)}</p>
    ${data.actionUrl ? `<a href="${escapeHtml(data.actionUrl)}" class="cta-button">${escapeHtml(data.actionLabel || "Learn More")}</a>` : ""}
    ${data.senderName ? `<p style="margin-top: 24px; color: #52525b;">— ${escapeHtml(data.senderName)}</p>` : ""}
  `;
  const htmlBody = campusOSEmailWrapper(subject, bodyHtml);
  const textBody = [
    data.title,
    "",
    `Hi ${data.recipientName},`,
    "",
    data.body,
    "",
    data.actionUrl ? `${data.actionLabel || "Learn More"}: ${data.actionUrl}` : "",
    data.senderName ? `— ${data.senderName}` : "",
    "",
    "— CampusOS University Operating System",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to,
    subject,
    htmlBody,
    textBody,
    templateType: "announcement",
    metadata: {
      title: data.title,
      senderName: data.senderName,
    },
  };
}

// ---------------------------------------------------------------------------
// DemoGmailService — in-memory fallback (never sends real emails)
// ---------------------------------------------------------------------------

export interface SentEmailRecord {
  messageId: string;
  threadId?: string;
  to: EmailRecipient;
  subject: string;
  templateType: EmailTemplateType;
  sentAt: string;
  provider: "demo_local";
  htmlBody: string;
  textBody: string;
}

// In-memory store for demo sent emails (visible across tests)
const demoSentEmails: SentEmailRecord[] = [];

export class DemoGmailService implements GmailService {
  readonly providerName = "demo_local" as const;

  async previewEmail(message: EmailMessage): Promise<EmailPreview> {
    const validation = validateRecipient(message.to);
    if (!validation.valid) {
      throw {
        error: "invalid_recipient" as GmailErrorCode,
        message: validation.error!,
        statusCode: 400,
      } satisfies GmailError;
    }

    return {
      to: message.to,
      subject: message.subject,
      htmlBody: message.htmlBody,
      textBody: message.textBody,
      templateType: message.templateType,
      estimatedSizeBytes: Buffer.byteLength(message.htmlBody, "utf8") + Buffer.byteLength(message.textBody, "utf8"),
    };
  }

  async sendEmail(message: EmailMessage, confirmed: boolean): Promise<EmailSendResult> {
    const validation = validateRecipient(message.to);
    if (!validation.valid) {
      throw {
        error: "invalid_recipient" as GmailErrorCode,
        message: validation.error!,
        statusCode: 400,
      } satisfies GmailError;
    }

    if (!confirmed) {
      throw {
        error: "send_failed" as GmailErrorCode,
        message: "Email sending requires explicit user confirmation. Set confirmed=true after previewing.",
        statusCode: 400,
      } satisfies GmailError;
    }

    const messageId = `demo_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const threadId = `demo_thread_${Date.now()}`;
    const sentAt = new Date().toISOString();

    const record: SentEmailRecord = {
      messageId,
      threadId,
      to: message.to,
      subject: message.subject,
      templateType: message.templateType,
      sentAt,
      provider: "demo_local",
      htmlBody: message.htmlBody,
      textBody: message.textBody,
    };
    demoSentEmails.push(record);

    return {
      messageId,
      threadId,
      sentAt,
      provider: "demo_local",
    };
  }

  buildRegistrationConfirmation(to: EmailRecipient, data: RegistrationConfirmationData): EmailMessage {
    return buildRegistrationConfirmationEmail(to, data);
  }

  buildPaymentConfirmation(to: EmailRecipient, data: PaymentConfirmationData): EmailMessage {
    return buildPaymentConfirmationEmail(to, data);
  }

  buildOrganizerNotification(to: EmailRecipient, data: OrganizerNotificationData): EmailMessage {
    return buildOrganizerNotificationEmail(to, data);
  }

  buildAnnouncement(to: EmailRecipient, data: AnnouncementData): EmailMessage {
    return buildAnnouncementEmail(to, data);
  }
}

/**
 * Access the demo sent emails store for testing/inspection.
 */
export function getDemoSentEmails(): SentEmailRecord[] {
  return demoSentEmails;
}

/**
 * Clear the demo sent emails store (for test isolation).
 */
export function clearDemoSentEmails(): void {
  demoSentEmails.length = 0;
}

// ---------------------------------------------------------------------------
// GoogleGmailService — real Gmail API integration
// ---------------------------------------------------------------------------

/**
 * Maps Google API errors to standard CampusOS Gmail error codes.
 */
export function mapGmailError(err: any): GmailError {
  // Prevent double-mapping: if already a GmailError, return as-is
  if (err && err.error && err.statusCode && err.message) {
    return err as GmailError;
  }

  const message = err?.message || String(err);
  const status = err?.status || err?.code || 500;

  if (
    message.includes("invalid_grant") ||
    message.includes("revoked") ||
    message.includes("unauthorized_client") ||
    message.includes("Token has been expired or revoked")
  ) {
    return {
      error: "revoked_consent",
      message: "Gmail authorization has been revoked or expired. Please reconnect your Google account.",
      statusCode: 403,
    };
  }

  if (message.includes("expired_token") || message.includes("Invalid Credentials") || status === 401) {
    return {
      error: "expired_token",
      message: "Google access token has expired and could not be renewed.",
      statusCode: 401,
    };
  }

  if (
    message.includes("insufficient") ||
    message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
    message.includes("Insufficient Permission")
  ) {
    return {
      error: "insufficient_scope",
      message: "Insufficient permissions granted. Please grant gmail.send permission.",
      statusCode: 403,
    };
  }

  if (
    status === 429 ||
    message.includes("quotaExceeded") ||
    message.includes("rateLimitExceeded") ||
    message.includes("userRateLimitExceeded")
  ) {
    return {
      error: "api_quota",
      message: "Gmail API rate limit or quota exceeded. Please try again later.",
      statusCode: 429,
    };
  }

  if (message.includes("disconnected") || message.includes("not connected")) {
    return {
      error: "disconnected",
      message: "Google account is not connected. Please authorize Gmail.",
      statusCode: 404,
    };
  }

  return {
    error: "unknown_error",
    message: message || "An unexpected error occurred while communicating with Gmail.",
    statusCode: typeof status === "number" && status >= 400 && status < 600 ? status : 500,
  };
}

/**
 * Builds a raw RFC 2822 email message suitable for Gmail API.
 */
function buildRawEmail(
  from: string,
  to: EmailRecipient,
  subject: string,
  htmlBody: string,
  textBody: string
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const toAddress = to.name ? `"${to.name}" <${to.email}>` : to.email;

  const raw = [
    `From: ${from}`,
    `To: ${toAddress}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    "",
    textBody,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    "",
    htmlBody,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return raw;
}

/**
 * Creates an authenticated Gmail API client.
 * Delegates to mock sandbox when running with mock/test tokens.
 */
export function createAuthenticatedGmailClient(
  decryptedRefreshToken: string
): gmail_v1.Gmail {
  // Test error simulation hooks (same pattern as calendar/drive)
  if (decryptedRefreshToken === "test_expired_token") {
    return {
      users: {
        messages: {
          send: () => Promise.reject({ status: 401, message: "expired_token: Invalid Credentials" }),
        },
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_revoked_consent") {
    return {
      users: {
        messages: {
          send: () => Promise.reject({ status: 403, message: "invalid_grant: Token has been expired or revoked" }),
        },
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_api_quota") {
    return {
      users: {
        messages: {
          send: () => Promise.reject({ status: 429, message: "quotaExceeded: User Rate Limit Exceeded" }),
        },
      },
    } as any;
  }

  if (decryptedRefreshToken === "test_insufficient_scope") {
    return {
      users: {
        messages: {
          send: () => Promise.reject({ status: 403, message: "ACCESS_TOKEN_SCOPE_INSUFFICIENT: Insufficient Permission" }),
        },
      },
    } as any;
  }

  // Mock/sandbox mode
  if (decryptedRefreshToken.startsWith("mock_rt_") || !process.env.GOOGLE_CLIENT_SECRET) {
    return {
      users: {
        messages: {
          send: async (params: any) => {
            // In mock mode, just simulate a successful send
            return {
              data: {
                id: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                threadId: `mock_thread_${Date.now()}`,
                labelIds: ["SENT"],
              },
            };
          },
        },
      },
    } as any;
  }

  // Live Gmail API
  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: decryptedRefreshToken,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}

export class GoogleGmailService implements GmailService {
  readonly providerName = "google_gmail" as const;
  private client: gmail_v1.Gmail;
  private senderEmail: string;

  constructor(client: gmail_v1.Gmail, senderEmail: string) {
    this.client = client;
    this.senderEmail = senderEmail;
  }

  async previewEmail(message: EmailMessage): Promise<EmailPreview> {
    const validation = validateRecipient(message.to);
    if (!validation.valid) {
      throw {
        error: "invalid_recipient" as GmailErrorCode,
        message: validation.error!,
        statusCode: 400,
      } satisfies GmailError;
    }

    return {
      to: message.to,
      subject: message.subject,
      htmlBody: message.htmlBody,
      textBody: message.textBody,
      templateType: message.templateType,
      estimatedSizeBytes: Buffer.byteLength(message.htmlBody, "utf8") + Buffer.byteLength(message.textBody, "utf8"),
    };
  }

  async sendEmail(message: EmailMessage, confirmed: boolean): Promise<EmailSendResult> {
    const validation = validateRecipient(message.to);
    if (!validation.valid) {
      throw {
        error: "invalid_recipient" as GmailErrorCode,
        message: validation.error!,
        statusCode: 400,
      } satisfies GmailError;
    }

    if (!confirmed) {
      throw {
        error: "send_failed" as GmailErrorCode,
        message: "Email sending requires explicit user confirmation. Set confirmed=true after previewing.",
        statusCode: 400,
      } satisfies GmailError;
    }

    try {
      const rawEmail = buildRawEmail(
        this.senderEmail,
        message.to,
        message.subject,
        message.htmlBody,
        message.textBody
      );

      // Base64url encode the raw email for Gmail API
      const encodedMessage = Buffer.from(rawEmail)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await this.client.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        messageId: res.data.id || `sent_${Date.now()}`,
        threadId: res.data.threadId || undefined,
        sentAt: new Date().toISOString(),
        provider: "google_gmail",
      };
    } catch (err: any) {
      throw mapGmailError(err);
    }
  }

  buildRegistrationConfirmation(to: EmailRecipient, data: RegistrationConfirmationData): EmailMessage {
    return buildRegistrationConfirmationEmail(to, data);
  }

  buildPaymentConfirmation(to: EmailRecipient, data: PaymentConfirmationData): EmailMessage {
    return buildPaymentConfirmationEmail(to, data);
  }

  buildOrganizerNotification(to: EmailRecipient, data: OrganizerNotificationData): EmailMessage {
    return buildOrganizerNotificationEmail(to, data);
  }

  buildAnnouncement(to: EmailRecipient, data: AnnouncementData): EmailMessage {
    return buildAnnouncementEmail(to, data);
  }
}

// ---------------------------------------------------------------------------
// OAuth URL generation for Gmail scope
// ---------------------------------------------------------------------------

export function getGmailAuthUrl(state?: string): string {
  const oauth2Client = getGoogleOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_GMAIL_SCOPES,
    state,
  });
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

export interface GetGmailServiceOptions {
  encryptedRefreshToken?: string;
  userId: string;
  userEmail?: string;
}

/**
 * Factory: returns the appropriate GmailService based on connection state.
 * Falls back to DemoGmailService when no valid connection exists.
 */
export function getGmailService(options: GetGmailServiceOptions): GmailService {
  const { encryptedRefreshToken, userEmail } = options;

  if (!encryptedRefreshToken) {
    return new DemoGmailService();
  }

  try {
    const decryptedToken = decryptRefreshToken(encryptedRefreshToken);
    const client = createAuthenticatedGmailClient(decryptedToken);
    return new GoogleGmailService(client, userEmail || "noreply@campusos.edu");
  } catch {
    // If decryption fails, fall back to demo
    return new DemoGmailService();
  }
}
