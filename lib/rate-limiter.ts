import type { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
  lastRequestTime: number;
}

class MemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxAllowed: number;

  constructor(windowMs: number, maxAllowed: number) {
    this.windowMs = windowMs;
    this.maxAllowed = maxAllowed;

    // Periodically clean up stale entries every 15 minutes
    if (typeof setInterval !== "undefined") {
      setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
          if (now - record.firstRequestTime > this.windowMs) {
            this.store.delete(key);
          }
        }
      }, 15 * 60 * 1000).unref?.();
    }
  }

  check(key: string): { success: boolean; remaining: number; resetInHours: number } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now - record.firstRequestTime > this.windowMs) {
      // First request in this window or previous window has expired
      this.store.set(key, {
        count: 1,
        firstRequestTime: now,
        lastRequestTime: now,
      });
      return {
        success: true,
        remaining: this.maxAllowed - 1,
        resetInHours: Math.ceil(this.windowMs / 3600000),
      };
    }

    if (record.count >= this.maxAllowed) {
      const msLeft = this.windowMs - (now - record.firstRequestTime);
      return {
        success: false,
        remaining: 0,
        resetInHours: Math.max(1, Math.ceil(msLeft / 3600000)),
      };
    }

    record.count += 1;
    record.lastRequestTime = now;
    return {
      success: true,
      remaining: this.maxAllowed - record.count,
      resetInHours: Math.ceil(this.windowMs / 3600000),
    };
  }
}

// Global persistent rate limiter instance across hot-reloads and requests:
// Max 3 registrations per IP per 24 hours
const globalRateLimiter =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any).__signupRateLimiter as MemoryRateLimiter) ||
  new MemoryRateLimiter(24 * 60 * 60 * 1000, 3);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__signupRateLimiter = globalRateLimiter;

export const signupRateLimiter = globalRateLimiter;

/**
 * Safely extracts client IP address from standard reverse-proxy headers
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}
