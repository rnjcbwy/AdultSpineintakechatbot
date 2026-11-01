import { NextResponse } from 'next/server';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError, logEvent } from '../../../lib/server/log';
import { saveDraft, loadDraft, parseCode, MAX_DRAFT_BYTES } from '../../../lib/server/draftStore';
import { emailConfigured, sendEmail, isEmail } from '../../../lib/server/email';
import { getApiKey, practiceHubConfigured } from '../../../lib/server/practicehub';
import crypto from 'node:crypto';
import { SITES } from '../../../lib/siteLock';
import { intakeEmail } from '../../../lib/server/intakeEmail';
import { PRACTICE } from '../../../lib/deploymentTier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The form's own address, for the link in the email. */
function siteUrl(request) {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  return `${proto}://${host}`;
}

/**
 * POST /api/draft — save the answers so far and get a link to finish later.
 *
 * Body: { intakeData, draft?: { id, token }, email?, purpose?, nextUrl? }
 * A `draft` from an earlier save overwrites that draft (the link stays the
 * same). With `email`, the link is sent by Amazon SES when EMAIL_FROM is set;
 * the message holds the link only. `purpose: 'express'` words the message as
 * the pre-visit questionnaire that follows the website form. `nextUrl`, one of
 * the practice's own intake sites (lib/siteLock.js), replaces the finish-later
 * link in the message when the questionnaire lives on another site.
 */
/** Practice Hub saves phone-intake drafts with the shared service key; those are not rate-limited by IP. */
async function fromPracticeHub(request) {
  const auth = request.headers.get('authorization') || '';
  const presented = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!presented || !practiceHubConfigured()) return false;
  try {
    const key = await getApiKey();
    const a = Buffer.from(presented);
    const b = Buffer.from(key);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request) {
  const trusted = await fromPracticeHub(request);
  const limited = trusted ? null : limitOr429(request, 'draft', 30, 60 * 60_000);
  if (limited) return limited;

  const raw = await request.text();
  if (raw.length > MAX_DRAFT_BYTES) return NextResponse.json({ error: 'The draft is too large.' }, { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 });
  }
  const intake = body?.intakeData;
  if (!intake || typeof intake !== 'object') return NextResponse.json({ error: 'Missing intake data.' }, { status: 400 });

  const existing = body.draft && parseCode(`${body.draft.id}.${body.draft.token}`) ? body.draft : null;
  try {
    const saved = (await saveDraft(intake, existing)) || (await saveDraft(intake, null));
    const code = `${saved.id}.${saved.token}`;
    const url = `${siteUrl(request)}/?resume=${code}`;
    const wanted = String(body.nextUrl || '');
    const next = Object.values(SITES).some((s) => wanted === s || wanted.startsWith(`${s}/`)) ? wanted : '';
    let emailed = false;
    let emailError = null;
    const to = String(body.email || '').trim();
    if (to) {
      if (!isEmail(to)) emailError = 'invalid';
      else if (!emailConfigured()) emailError = 'not-configured';
      else {
        try {
          // The letter Practice Hub sends, in the patient's language: the welcome
          // after the Book a consult form, or the finish-later link.
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const mail = intakeEmail({
            url: next || url,
            expires: `${String(expires.getUTCMonth() + 1).padStart(2, '0')}/${String(expires.getUTCDate()).padStart(2, '0')}/${expires.getUTCFullYear()}`,
            patientFirstName: String(intake.demographics?.firstName || ''),
            isMinor: /^peds_/.test(String(intake.service?.key || intake.express?.service || '')),
            officePhone: PRACTICE.officePhone,
            logoUrl: `${siteUrl(request)}/icons/holyname-logo.png`,
            lang: intake.language || null,
            occasion: body.purpose === 'express' ? 'express' : 'resume',
            siteLink: !!next,
          });
          await sendEmail({ to, subject: mail.subject, text: mail.text, html: mail.html });
          emailed = true;
        } catch (err) {
          logError('draft.email_failed', err);
          emailError = 'send-failed';
        }
      }
    }
    logEvent('draft.saved', { draftId: saved.id, refreshed: !!existing, emailed, source: trusted ? String(body.source || 'practicehub').slice(0, 20) : 'patient' });
    return NextResponse.json({ id: saved.id, token: saved.token, url, next: next || null, emailed, emailError, emailAvailable: emailConfigured() });
  } catch (err) {
    logError('draft.save_failed', err);
    return NextResponse.json({ error: 'Could not save the draft. Please try again in a moment.' }, { status: 500 });
  }
}

/** GET /api/draft?code=… — the answers behind a finish-later link. */
export async function GET(request) {
  const limited = limitOr429(request, 'draft-load', 20, 10 * 60_000);
  if (limited) return limited;
  const code = new URL(request.url).searchParams.get('code') || '';
  if (!parseCode(code)) return NextResponse.json({ status: 'unknown' }, { headers: { 'Cache-Control': 'private, no-store' } });
  try {
    const d = await loadDraft(code);
    if (!d) return NextResponse.json({ status: 'unknown' }, { headers: { 'Cache-Control': 'private, no-store' } });
    logEvent('draft.loaded', { draftId: d.id });
    return NextResponse.json({ status: 'ok', id: d.id, token: d.token, savedAt: d.savedAt, intake: d.intake }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    logError('draft.load_failed', err);
    return NextResponse.json({ status: 'unknown' }, { headers: { 'Cache-Control': 'private, no-store' } });
  }
}
