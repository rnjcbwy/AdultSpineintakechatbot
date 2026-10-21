import { NextResponse } from 'next/server';
import { limitOr429 } from '../../../lib/server/rateLimit';
import { logError, logEvent } from '../../../lib/server/log';
import { saveDraft, loadDraft, parseCode, MAX_DRAFT_BYTES } from '../../../lib/server/draftStore';
import { emailConfigured, sendEmail, isEmail } from '../../../lib/server/email';
import { getApiKey, practiceHubConfigured } from '../../../lib/server/practicehub';
import crypto from 'node:crypto';

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
 * Body: { intakeData, draft?: { id, token }, email?, purpose? }
 * A `draft` from an earlier save overwrites that draft (the link stays the
 * same). With `email`, the link is sent by Amazon SES when EMAIL_FROM is set;
 * the message holds the link only. `purpose: 'express'` words the message as
 * the pre-visit questionnaire that follows the website chat.
 */
const MESSAGES = {
  draft: {
    subject: 'Your link to finish your spine intake form',
    text: (url) => `Here is the link to pick up your spine intake form where you left off:\n\n${url}\n\nIt works for 30 days and opens the answers you have given so far, so please do not forward it. Any records you attached stay on the device you added them from; you can attach them again or bring them to your visit.\n\nIf you did not ask for this link, you can ignore this message.`,
  },
  express: {
    subject: "Welcome from Dr. Aaron Wey's office: your pre-visit questionnaire",
    text: (url) => `Welcome to our practice, and thank you for contacting Dr. Aaron Wey's office. We look forward to meeting you. The office will contact you within 24 to 48 hours to schedule your appointment.\n\nIn the meantime, please complete your pre-visit questionnaire using the secure link below. It takes about 15 minutes, saves as you go, can be finished on a phone, tablet or computer, and really helps our team prepare for your visit:\n\n${url}\n\nThe link works for 30 days and opens the answers you have already given, so please do not forward it.\n\nIf you have questions before we call, reply to this message or call the office at (201) 836-1663. If you did not ask for this link, you can ignore this message.\n\nDr. Aaron Wey's office\nAdult and Pediatric Spine Surgery\n870 Palisade Ave, Teaneck, NJ 07666\n(201) 836-1663`,
  },
};
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
    let emailed = false;
    let emailError = null;
    const to = String(body.email || '').trim();
    if (to) {
      if (!isEmail(to)) emailError = 'invalid';
      else if (!emailConfigured()) emailError = 'not-configured';
      else {
        try {
          const message = MESSAGES[body.purpose === 'express' ? 'express' : 'draft'];
          await sendEmail({ to, subject: message.subject, text: message.text(url) });
          emailed = true;
        } catch (err) {
          logError('draft.email_failed', err);
          emailError = 'send-failed';
        }
      }
    }
    logEvent('draft.saved', { draftId: saved.id, refreshed: !!existing, emailed, source: trusted ? String(body.source || 'practicehub').slice(0, 20) : 'patient' });
    return NextResponse.json({ id: saved.id, token: saved.token, url, emailed, emailError, emailAvailable: emailConfigured() });
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
