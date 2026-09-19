// Integration Service Interfaces & Stubs (Phase 2 skeleton)

export interface ServiceHealth {
  name: string;
  status: "connected" | "demo_fallback" | "error";
  message?: string;
  isMock: boolean;
}

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
}

export interface RazorpayOrderPayload {
  amount: number; // in paise (e.g. 49900 = ₹499)
  currency: string;
  receipt: string;
}

export function checkIntegrationsHealth(): Record<string, ServiceHealth> {
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  return {
    google: {
      name: "Google Workspace APIs",
      status: hasGoogle ? "connected" : "demo_fallback",
      isMock: !hasGoogle,
      message: hasGoogle ? "Ready" : "Running in Demo Mode (Mock Adapter active)",
    },
    razorpay: {
      name: "Razorpay Gateway",
      status: hasRazorpay ? "connected" : "demo_fallback",
      isMock: !hasRazorpay,
      message: hasRazorpay ? "Ready" : "Running in Demo Mode (Simulated checkout active)",
    },
    gemini: {
      name: "Gemini AI Engine",
      status: hasGemini ? "connected" : "demo_fallback",
      isMock: !hasGemini,
      message: hasGemini ? "Ready" : "Running in Demo Mode (Deterministic AI assistant active)",
    },
  };
}

export * from "./razorpay";
export * from "./google-calendar";
export * from "./google-drive";
