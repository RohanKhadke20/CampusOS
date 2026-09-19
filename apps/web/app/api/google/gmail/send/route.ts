import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getGmailService, validateRecipient } from "@campusos/integrations";
import type { EmailTemplateType } from "@campusos/integrations";

/**
 * POST /api/google/gmail/send
 * Send an email. Requires explicit confirmation (confirmed=true) for user-triggered messages.
 * Before sending: validates recipient, logs action to audit_logs.
 *
 * Body:
 *  - templateType: "registration_confirmation" | "payment_confirmation" | "organizer_notification" | "announcement"
 *  - to: { email: string, name?: string }
 *  - data: template-specific data object
 *  - confirmed: boolean (REQUIRED, must be true)
 *  - subject/htmlBody/textBody: raw content (if not using a template)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      templateType,
      to,
      data,
      confirmed,
      subject: rawSubject,
      htmlBody: rawHtmlBody,
      textBody: rawTextBody,
    } = body;

    if (!to?.email) {
      return NextResponse.json(
        { success: false, error: "Recipient email is required." },
        { status: 400 }
      );
    }

    // Validate recipient before any send attempt
    const validation = validateRecipient(to);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: "invalid_recipient", message: validation.error },
        { status: 400 }
      );
    }

    // Require explicit confirmation for user-triggered messages
    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          error: "confirmation_required",
          message:
            "Email sending requires explicit user confirmation. Preview the email first, then set confirmed=true.",
        },
        { status: 400 }
      );
    }

    const connection = demoDb.getGoogleConnection(user.id);
    const hasGmail = connection && connection.scope.includes("gmail.send");

    const service = getGmailService({
      encryptedRefreshToken: hasGmail ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    let emailMessage;

    switch (templateType as EmailTemplateType) {
      case "registration_confirmation":
        emailMessage = service.buildRegistrationConfirmation(to, data);
        break;
      case "payment_confirmation":
        emailMessage = service.buildPaymentConfirmation(to, data);
        break;
      case "organizer_notification":
        emailMessage = service.buildOrganizerNotification(to, data);
        break;
      case "announcement":
        emailMessage = service.buildAnnouncement(to, data);
        break;
      default:
        if (!rawSubject || !rawTextBody) {
          return NextResponse.json(
            {
              success: false,
              error: "Either a valid templateType or raw subject/textBody is required.",
            },
            { status: 400 }
          );
        }
        emailMessage = {
          to,
          subject: rawSubject,
          htmlBody: rawHtmlBody || `<p>${rawTextBody}</p>`,
          textBody: rawTextBody,
          templateType: "announcement" as EmailTemplateType,
          metadata: { custom: true },
        };
    }

    // Send the email
    const result = await service.sendEmail(emailMessage, true);

    // Log sent message to database for audit trail
    demoDb.createGmailMessage({
      userId: user.id,
      messageId: result.messageId,
      threadId: result.threadId,
      toEmail: to.email,
      toName: to.name,
      subject: emailMessage.subject,
      templateType: emailMessage.templateType,
      provider: result.provider,
      sentAt: result.sentAt,
      metadata: emailMessage.metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
      provider: service.providerName,
      data: {
        messageId: result.messageId,
        threadId: result.threadId,
        sentAt: result.sentAt,
      },
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "send_failed",
        message: error.message || "Failed to send email.",
      },
      { status }
    );
  }
}
