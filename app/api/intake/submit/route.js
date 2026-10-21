import { NextResponse } from 'next/server';
import { getService } from '../../../../lib/service';
import { cleanCampaign } from '../../../../lib/campaign';
import { consentComplete, expressConsentComplete } from '../../../../lib/consent';
import { isExpressLead } from '../../../../lib/express';
import { deleteDraft, isDraftId } from '../../../../lib/server/draftStore';
import { limitOr429 } from '../../../../lib/server/rateLimit';
import { logError, logEvent } from '../../../../lib/server/log';
import {
  newSubmissionId, newAccessToken, hashToken, saveIntake, saveState, markPending,
  presignUpload, keys, storeKind, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS,
} from '../../../../lib/server/submissionStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_INTAKE_BYTES = 3 * 1024 * 1024;

/**
 * POST /api/intake/submit — step 1 of a submission.
 *
 * Stores the structured answers durably and returns, per attached record, an
 * upload instruction (a presigned S3 PUT in production, the app's own upload
 * route in development). The browser then uploads the files and calls
 * /finalize, which starts the background worker.
 *
 * The answers are stored BEFORE anything slow or fallible happens, so a
 * patient who closes the tab after this call has still been received.
 */
export async function POST(request) {
  const limited = limitOr429(request, 'submit', 6, 60 * 60_000);
  if (limited) return limited;

  const raw = await request.text();
  if (raw.length > MAX_INTAKE_BYTES) return NextResponse.json({ error: 'The intake is too large.' }, { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 });
  }
  const intake = body?.intakeData;
  if (!intake || typeof intake !== 'object') return NextResponse.json({ error: 'Missing intake data.' }, { status: 400 });

  const d = intake.demographics || {};
  // An express request (lib/express.js) is a lead, not a completed intake:
  // name, date of birth and a way to reach the patient, with the two
  // acknowledgments the card shows. Practice Hub needs the date of birth to
  // find or open the chart.
  const express = isExpressLead(intake);
  if (!String(d.firstName || '').trim() || !String(d.lastName || '').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(String(d.dob || ''))) {
    return NextResponse.json({ error: 'Please enter your first name, last name and date of birth before submitting.' }, { status: 422 });
  }
  if (express && !String(d.phone || '').trim() && !String(d.email || '').trim()) {
    return NextResponse.json({ error: 'Please give a phone number or an email address so the office can reach you.' }, { status: 422 });
  }
  if (express ? !expressConsentComplete(intake.consent) : !consentComplete(intake.consent)) {
    return NextResponse.json({ error: 'Please check each acknowledgment and type your name as your signature before submitting.' }, { status: 422 });
  }

  // Server-owned fields are never taken from the client. A finish-later
  // draft is removed once the answers are in (the link is dead from here).
  const { submission: _ignored, generatedSummary: _old, draft, ...clean } = intake;
  if (draft && isDraftId(draft.id)) deleteDraft(draft.id).catch(() => {});
  const documents = (Array.isArray(clean.documents) ? clean.documents : [])
    .filter((doc) => doc && typeof doc.id === 'string' && /^doc_[a-z0-9_]+$/i.test(doc.id))
    .slice(0, MAX_ATTACHMENTS)
    .map((doc) => ({
      id: doc.id,
      category: String(doc.category || 'other').slice(0, 40),
      name: String(doc.name || 'file').slice(0, 200),
      type: String(doc.type || 'application/octet-stream').slice(0, 100),
      size: Number(doc.size) || 0,
      uploadedAt: doc.uploadedAt || null,
    }));
  clean.documents = documents;
  // Campaign tags are slugs the practice chose; anything else the browser sent is dropped.
  clean.campaign = cleanCampaign(clean.campaign);

  const id = newSubmissionId();
  const token = newAccessToken();
  const now = new Date().toISOString();
  // The red-flag rules belong to the intake's service (spine or bone-and-joint).
  const redFlags = getService(clean.service?.key).redFlags.detectRedFlags(clean);
  const state = {
    id,
    createdAt: now,
    finalizedAt: null,
    status: 'received',
    accessTokenHash: hashToken(token),
    attempts: 0,
    uploadsExpected: documents.filter((doc) => doc.size <= MAX_ATTACHMENT_BYTES).length,
    redFlagCount: redFlags.length,
    language: clean.language || 'en',
    ...(express ? { express: true } : {}),
  };

  try {
    await saveIntake(id, { ...clean, submission: { id, submittedAt: now } });
    await saveState(id, state);
    await markPending(id);
  } catch (err) {
    logError('submit.store_failed', err);
    return NextResponse.json({ error: 'We could not save your form. Please try again.' }, { status: 503 });
  }

  const uploads = [];
  for (const doc of documents) {
    if (doc.size > MAX_ATTACHMENT_BYTES) { uploads.push({ docId: doc.id, skipped: 'too large' }); continue; }
    const key = keys.attachment(id, doc.id);
    const signed = await presignUpload(key, doc.type).catch((err) => { logError('submit.presign_failed', err, { submissionId: id }); return null; });
    if (signed) uploads.push({ docId: doc.id, ...signed });
    else if (storeKind() === 'local') uploads.push({ docId: doc.id, method: 'POST', url: `/api/intake/${id}/upload?doc=${encodeURIComponent(doc.id)}`, headers: {}, local: true });
    else uploads.push({ docId: doc.id, skipped: 'upload unavailable' });
  }

  // The campaign fields are cleaned slugs, so they are safe to log; counting
  // submit.received lines by campaign gives completed intakes per ad.
  const c = clean.campaign || {};
  logEvent('submit.received', {
    submissionId: id, attachments: uploads.length, redFlags: redFlags.length, store: storeKind(), express,
    ...(clean.campaign ? { utmSource: c.source || '', utmMedium: c.medium || '', utmCampaign: c.campaign || '', utmContent: c.content || '' } : {}),
  });
  return NextResponse.json({ id, token, uploads, redFlags }, { status: 201 });
}
