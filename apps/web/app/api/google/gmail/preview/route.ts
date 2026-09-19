import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getGmailService, validateRecipient } from "@campusos/integrations";
import type { EmailTemplateType } from "@campusos/integrations";

/**
 * POST /api/google/gmail/preview
 * Generate an email preview without sending it.
 * Supports building emails from template data or from raw content.
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
      // Template-specific data
      data,
      // Raw content (used when templateType is not provided or for custom announcements)
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

    // Validate recipient
    const validation = validateRecipient(to);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: "invalid_recipient", message: validation.error },
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
        // Custom / raw email
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
        };
    }

    const preview = await service.previewEmail(emailMessage);

    return NextResponse.json({
      success: true,
      provider: service.providerName,
      data: preview,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "preview_failed",
        message: error.message || "Failed to generate email preview.",
      },
      { status }
    );
  }
}
