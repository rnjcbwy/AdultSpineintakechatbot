// ============================================================================
// In-memory sliding-window rate limiter for the public endpoints.
//
// A patient-facing form has no login to hang quotas on, so the client IP is
// the key. Each serverless instance keeps its own counters, which makes this a
// per-instance ceiling rather than a global one; it is a brake on accidental
// loops and casual abuse, and AWS WAF can be put in front for anything more.
// ============================================================================

const buckets = new Map();

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : request.headers.get('x-real-ip');
  return ip || 'unknown';
}

/** @returns {{ok:boolean, retryAfterSec:number}} */
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Convenience for route handlers: null when allowed, a 429 Response otherwise. */
export function limitOr429(request, scope, max, windowMs) {
  const r = rateLimit(`${scope}:${clientIp(request)}`, max, windowMs);
  if (r.ok) return null;
  return Response.json(
    { error: 'Too many requests. Please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(r.retryAfterSec) } },
  );
}
