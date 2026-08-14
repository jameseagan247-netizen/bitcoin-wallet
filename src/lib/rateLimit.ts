type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || now >= existing.resetAt) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(
        Math.max(0, existing.resetAt - now) / 1000
      ),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - existing.count,
    retryAfter: Math.ceil(
      Math.max(0, existing.resetAt - now) / 1000
    ),
  };
}

/**
 * Clears the rate-limit entry for a key.
 *
 * Useful after a successful login so successful
 * authentication does not leave stale failed-attempt
 * state behind.
 */
export function resetRateLimit(key: string) {
  attempts.delete(key);
}
