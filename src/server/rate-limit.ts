import { headers } from "next/headers";

type RateLimitAction =
  "create_event" | "join_event" | "save_availability" | "finalize_event";

interface RateLimitRule {
  readonly limit: number;
  readonly windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitRules: Record<RateLimitAction, RateLimitRule> = {
  create_event: { limit: 5, windowMs: 10 * 60 * 1000 },
  join_event: { limit: 40, windowMs: 10 * 60 * 1000 },
  save_availability: { limit: 120, windowMs: 10 * 60 * 1000 },
  finalize_event: { limit: 30, windowMs: 10 * 60 * 1000 },
};

const buckets = new Map<string, RateLimitEntry>();

export async function checkActionRateLimit(
  action: RateLimitAction,
): Promise<boolean> {
  const requestHeaders = await headers();
  return consumeRateLimit(action, getClientIp(requestHeaders), Date.now());
}

export function consumeRateLimit(
  action: RateLimitAction,
  clientIp: string,
  now: number,
): boolean {
  const rule = rateLimitRules[action];
  const key = `${action}:${clientIp}`;
  const entry = buckets.get(key);

  cleanupExpiredBuckets(now);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + rule.windowMs,
    });
    return true;
  }

  if (entry.count >= rule.limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

function getClientIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("cf-connecting-ip") ??
    "unknown"
  );
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
