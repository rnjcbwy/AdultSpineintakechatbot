// ============================================================================
// Access gate for the clinician API.
//
// SCOPE, STATED PLAINLY: this is a single shared passphrase suitable for a
// tool running on an office machine. It is NOT identity management — there are
// no per-user accounts, no audit trail of who did what, and no MFA. Before this
// is exposed to the internet with real PHI it needs real authentication, an
// access log, encryption at rest, and BAAs with every vendor in the path.
//
// Safe by default: with no passphrase configured, the API is open in
// development but refuses to serve in production, so an unprotected patient
// cabinet cannot be deployed by accident.
// ============================================================================

import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'spine_clinician_session';
const TOKEN_PURPOSE = 'spine-clinician-v1';

function configuredPassword() {
  return process.env.CLINICIAN_PASSWORD || '';
}

/** Deterministic, stateless session token derived from the passphrase. */
export function expectedToken() {
  const pw = configuredPassword();
  if (!pw) return null;
  return crypto.createHmac('sha256', pw).update(TOKEN_PURPOSE).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function verifyPassword(candidate) {
  const pw = configuredPassword();
  if (!pw) return false;
  return safeEqual(candidate, pw);
}

/**
 * Returns null when the caller may proceed, or a Response to return as-is.
 */
export function requireAuth() {
  const pw = configuredPassword();

  if (!pw) {
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        {
          error:
            'CLINICIAN_PASSWORD is not set. The patient API refuses to run unprotected in production. ' +
            'Set it in the environment, and do not place real patient data behind this gate alone.',
        },
        { status: 503 }
      );
    }
    return null; // development convenience
  }

  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || !safeEqual(token, expectedToken())) {
    return Response.json({ error: 'Not signed in.' }, { status: 401 });
  }
  return null;
}

export function authStatus() {
  const pw = configuredPassword();
  if (!pw) {
    return {
      configured: false,
      open: process.env.NODE_ENV !== 'production',
      note:
        process.env.NODE_ENV === 'production'
          ? 'CLINICIAN_PASSWORD is not set — the API is disabled.'
          : 'CLINICIAN_PASSWORD is not set — the API is open in development only.',
    };
  }
  const token = cookies().get(SESSION_COOKIE)?.value;
  return {
    configured: true,
    open: !!token && safeEqual(token, expectedToken()),
    note: 'Shared passphrase. Not sufficient for internet-exposed PHI.',
  };
}
