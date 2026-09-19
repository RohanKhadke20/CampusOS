/**
 * CampusOS AI Security & Sanitization Pipeline
 * 
 * Strict safeguard: The model must NEVER directly receive raw database credentials,
 * API secrets, OAuth refresh tokens, or internal authorization information.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /encryptedrefreshtoken/i,
  /refreshtoken/i,
  /accesstoken/i,
  /keysecret/i,
  /clientsecret/i,
  /servicerolekey/i,
  /secret/i,
  /signature/i,
  /authtag/i,
  /privatekey/i,
  /cookie/i,
  /authorization/i,
  /session/i,
  /apikey/i,
  /token/i,
];

// Regexes to scrub sensitive patterns from free-form strings
const SENSITIVE_STRING_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // Database connection URIs
  {
    regex: /(postgres(?:ql)?|mysql|mongodb):\/\/[^:\s]+:[^@\s]+@[^\s/]+/gi,
    replacement: "[REDACTED_DB_CREDENTIALS]",
  },
  // Bearer and Basic authorization headers
  {
    regex: /bearer\s+[a-zA-Z0-9_\-\.=]+/gi,
    replacement: "Bearer [REDACTED_TOKEN]",
  },
  // AES-256-GCM encrypted token payloads (iv:authTag:encrypted)
  {
    regex: /[a-f0-9]{24}:[a-f0-9]{32}:[a-f0-9]{20,}/gi,
    replacement: "[REDACTED_ENCRYPTED_TOKEN]",
  },
  // Google OAuth tokens (ya29..., 1//..., mock_rt_...)
  {
    regex: /(?:ya29\.[a-zA-Z0-9_\-]+|1\/\/[a-zA-Z0-9_\-]+|mock_rt_[a-zA-Z0-9_]+|mock_at_[a-zA-Z0-9_]+)/g,
    replacement: "[REDACTED_OAUTH_TOKEN]",
  },
  // Razorpay or other API keys / secrets
  {
    regex: /(?:rzp_(?:test|live)_[a-zA-Z0-9]+)/gi,
    replacement: "[REDACTED_API_KEY]",
  },
  // JWT tokens
  {
    regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    replacement: "[REDACTED_JWT_TOKEN]",
  },
];

/**
 * Sanitizes a string to strip any credentials, secrets, or tokens before sending to the model.
 */
export function sanitizePrompt(text: string): string {
  if (!text || typeof text !== "string") return "";

  let sanitized = text;

  // Also strip known environment secrets if present in the process
  const knownSecrets = [
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.RAZORPAY_KEY_SECRET,
    process.env.GEMINI_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.GOOGLE_ENCRYPTION_KEY,
  ].filter(Boolean) as string[];

  for (const secret of knownSecrets) {
    if (secret && secret.length > 5) {
      sanitized = sanitized.split(secret).join("[REDACTED_SECRET]");
    }
  }

  for (const { regex, replacement } of SENSITIVE_STRING_PATTERNS) {
    sanitized = sanitized.replace(regex, replacement);
  }

  return sanitized;
}

/**
 * Recursively scrubs objects and arrays, removing sensitive keys and redacting sensitive values.
 */
export function sanitizeContext<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return sanitizePrompt(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeContext(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey) {
        cleaned[key] = "[REDACTED_CREDENTIAL]";
      } else {
        cleaned[key] = sanitizeContext(value);
      }
    }
    return cleaned as T;
  }

  return data;
}

/**
 * Verifies that an object or prompt contains no un-redacted credentials.
 */
export function containsSensitiveData(text: string): boolean {
  for (const { regex } of SENSITIVE_STRING_PATTERNS) {
    if (regex.test(text)) return true;
  }
  return false;
}
