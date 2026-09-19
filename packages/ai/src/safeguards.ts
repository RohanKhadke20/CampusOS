/**
 * CampusOS AI Safeguards: Rate Limiting, Limits & Failure Recovery
 */

export const DEFAULT_MAX_TOOL_CALLS = 5;
export const DEFAULT_MAX_INPUT_CHARACTERS = 16000;
export const DEFAULT_MAX_REQUESTS_PER_MINUTE = 30;

export class RateLimitExceededError extends Error {
  readonly statusCode = 429;
  constructor(message: string = "AI rate limit exceeded. Please try again in a minute.") {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

export class TokenLimitExceededError extends Error {
  readonly statusCode = 400;
  constructor(message: string = "Input exceeds maximum allowed token / character limit.") {
    super(message);
    this.name = "TokenLimitExceededError";
  }
}

export class ToolCallLimitExceededError extends Error {
  readonly statusCode = 400;
  constructor(message: string = `Maximum tool calls limit (${DEFAULT_MAX_TOOL_CALLS}) exceeded in a single request.`) {
    super(message);
    this.name = "ToolCallLimitExceededError";
  }
}

/**
 * In-memory sliding window rate limiter
 */
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number = DEFAULT_MAX_REQUESTS_PER_MINUTE, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const windowStart = now - this.windowMs;

    // Filter out timestamps older than the window
    const valid = timestamps.filter((t) => t > windowStart);

    if (valid.length >= this.maxRequests) {
      const oldest = valid[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return { allowed: false, remaining: 0, resetMs };
    }

    valid.push(now);
    this.requests.set(key, valid);

    return {
      allowed: true,
      remaining: this.maxRequests - valid.length,
      resetMs: this.windowMs,
    };
  }

  assertAllowed(key: string): void {
    const status = this.check(key);
    if (!status.allowed) {
      throw new RateLimitExceededError(
        `Rate limit exceeded for key: ${key}. Please wait ${Math.ceil(status.resetMs / 1000)}s before trying again.`
      );
    }
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const globalAiRateLimiter = new RateLimiter();

/**
 * Validates that prompt length is within safe bounds
 */
export function validateInputSafeguards(
  prompt: string,
  maxCharacters: number = DEFAULT_MAX_INPUT_CHARACTERS
): void {
  if (!prompt || typeof prompt !== "string") return;
  if (prompt.length > maxCharacters) {
    throw new TokenLimitExceededError(
      `Prompt of length ${prompt.length} characters exceeds safeguard limit of ${maxCharacters}.`
    );
  }
}

/**
 * Validates that the number of tool calls in a single execution step does not exceed maximum
 */
export function validateToolCallSafeguards(
  callCount: number,
  maxAllowed: number = DEFAULT_MAX_TOOL_CALLS
): void {
  if (callCount > maxAllowed) {
    throw new ToolCallLimitExceededError(
      `Execution requested ${callCount} tool calls, exceeding the safety ceiling of ${maxAllowed} tool calls per request.`
    );
  }
}

/**
 * Failure recovery helper: Executes an async operation with exponential backoff retries.
 */
export async function withFailureRecovery<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    fallback?: () => Promise<T> | T;
    isRetryable?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    initialDelayMs = 200,
    fallback,
    isRetryable = (err) => {
      const status = err?.status || err?.statusCode || 0;
      const msg = err?.message || String(err);
      return status === 429 || status >= 500 || msg.includes("fetch failed") || msg.includes("quota");
    },
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      if (attempt <= maxRetries && isRetryable(err)) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      if (fallback) {
        return await fallback();
      }

      throw err;
    }
  }
}
