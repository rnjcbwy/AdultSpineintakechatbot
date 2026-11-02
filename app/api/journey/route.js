import { NextResponse } from 'next/server';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError } from '../../../lib/server/log';
import { getApiKey, practiceHubConfigured, practiceHubUrl } from '../../../lib/server/practicehub';
import { authorizeSubmission } from '../../../lib/server/submissionAuth';
import { loadIntake } from '../../../lib/server/submissionStore';
import { journeyBriefing } from '../../../lib/journeyBriefing';
import { isServiceKey } from '../../../lib/service';
import { LOCKED_SERVICE } from '../../../lib/siteLock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Intake codes: one six-digit code that ties a phone call with the office's
 * assistant to this form (Practice Hub, server/intake-journeys.ts). The
 * browser never talks to Practice Hub; this route does, with the service key.
 *
 *  POST { kind: 'web_phone_first', firstName, lastName, dob, service, language }
 *       "Rather do this by phone?" at the start of the form.
 *  POST { kind: 'web_elaborate', submissionId }  (Authorization: Bearer <submission token>)
 *       "Tell Dr. Wey more in your own words" after submitting. The briefing
 *       for the assistant is built here from the stored answers.
 *     → { code, phone, days, languages }
 *  GET ?code=123456&dob=YYYY-MM-DD
 *     → { status, ref?, form?, doneSections?, regions?, language?, attemptsLeft? }
 *       Never answers: only which sections were done on the phone.
 */

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v, max) => String(v || '').trim().slice(0, max);

async function hub(path, init = {}) {
  const key = await getApiKey();
  const res = await fetch(`${practiceHubUrl()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function POST(request) {
  if (!practiceHubConfigured()) return NextResponse.json({ error: 'Not available.' }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  let payload;
  if (body.kind === 'web_elaborate') {
    const limited = limitOr429(request, 'journey-elaborate', 10, 60 * 60_000);
    if (limited) return limited;
    const auth = await authorizeSubmission(request, String(body.submissionId || ''));
    if (auth.response) return auth.response;
    const intake = await loadIntake(body.submissionId);
    if (!intake) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const d = intake.demographics || {};
    if (!ISO.test(d.dob || '') || !(d.firstName || d.lastName)) return NextResponse.json({ error: 'The form has no name or date of birth.' }, { status: 400 });
    payload = {
      kind: 'web_elaborate',
      form: isServiceKey(intake.service?.key) ? intake.service.key : LOCKED_SERVICE || 'adult_spine',
      firstName: clean(d.firstName, 100),
      lastName: clean(d.lastName, 100),
      dob: d.dob,
      language: clean(intake.language, 8) || undefined,
      submissionId: body.submissionId,
      briefing: journeyBriefing(intake),
    };
  } else if (body.kind === 'web_phone_first') {
    const limited = limitOr429(request, 'journey-phone-first', 10, 60 * 60_000);
    if (limited) return limited;
    const dob = clean(body.dob, 10);
    const firstName = clean(body.firstName, 100);
    const lastName = clean(body.lastName, 100);
    if (!ISO.test(dob) || !(firstName || lastName)) return NextResponse.json({ error: 'Please enter the name and date of birth.' }, { status: 400 });
    payload = {
      kind: 'web_phone_first',
      form: isServiceKey(body.service) ? body.service : LOCKED_SERVICE || 'adult_spine',
      firstName,
      lastName,
      dob,
      language: clean(body.language, 8) || undefined,
    };
  } else {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  try {
    const r = await hub('/api/intake/journey', { method: 'POST', body: JSON.stringify(payload) });
    if (!r.ok || !r.data?.code) return NextResponse.json({ error: 'Could not make a code right now.' }, { status: 502 });
    const { code, phone, days, languages } = r.data;
    return NextResponse.json({ code, phone, days, languages }, { headers: NO_STORE });
  } catch (err) {
    logError('journey.create_failed', err);
    return NextResponse.json({ error: 'Could not make a code right now.' }, { status: 502 });
  }
}

export async function GET(request) {
  const limited = limitOr429(request, 'journey-lookup', 20, 10 * 60_000);
  if (limited) return limited;
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').replace(/[^0-9]/g, '');
  const dob = url.searchParams.get('dob') || '';
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ status: 'unknown' });
  if (!practiceHubConfigured()) return NextResponse.json({ status: 'unknown' });
  try {
    const r = await hub(`/api/intake/journey?code=${code}${ISO.test(dob) ? `&dob=${dob}` : ''}`);
    if (!r.ok) return NextResponse.json({ status: 'unknown' });
    return NextResponse.json(r.data, { headers: NO_STORE });
  } catch (err) {
    logError('journey.lookup_failed', err);
    return NextResponse.json({ status: 'unknown' });
  }
}
