/**
 * Simple in-memory rate limiter for chat messages
 * 15 messages per minute per user
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60000; // Clean up expired entries every minute

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, CLEANUP_INTERVAL);

export function checkRateLimit(userId: string, maxMessages: number = 15, windowMs: number = 60000): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const key = userId;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxMessages - 1,
      resetAt
    };
  }

  // Entry exists and is still valid
  if (entry.count >= maxMessages) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: maxMessages - entry.count,
    resetAt: entry.resetAt
  };
}

