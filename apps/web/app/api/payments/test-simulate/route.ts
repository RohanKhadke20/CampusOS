import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/authorization";
import { generateTestPaymentSignature } from "@campusos/integrations";

/**
 * Helper endpoint for local / test environments to simulate Razorpay
 * hosted checkout callbacks when checkout.js cannot reach external networks.
 *
 * NOTE: Does NOT mark payment successful. The client MUST still submit the
 * returned signature to /api/payments/verify for authoritative server-side verification.
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
    const { orderId, simulateFailure } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (simulateFailure) {
      return NextResponse.json({
        success: true,
        data: {
          orderId,
          paymentId,
          signature: "invalid_tampered_signature_payload_for_testing",
        },
      });
    }

    // Generate valid HMAC signature matching the server's secret
    const signature = generateTestPaymentSignature(orderId, paymentId);

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentId,
        signature,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Simulation failed." },
      { status: 500 }
    );
  }
}
