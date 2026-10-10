import { NextResponse } from 'next/server';
import { authorizeSubmission } from '../../../../../lib/server/submissionAuth';
import { loadIntake, saveIntake, markPending } from '../../../../../lib/server/submissionStore';
import { dispatch } from '../../../../../lib/server/intakeDispatch';
import { limitOr429 } from '../../../../../lib/server/rateLimit';
import { logError, logEvent } from '../../../../../lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CORRECTIONS = 30;

/**
 * POST /api/intake/:id/rewrite — the patient corrected the draft note.
 * Saves the corrections with the stored answers and asks the worker to
 * rewrite the note, re-render the transcript and send the office an update.
 */
export async function POST(request, { params }) {
  const limited = limitOr429(request, 'rewrite', 10, 10 * 60_000);
  if (limited) return limited;
  const auth = await authorizeSubmission(request, params.id);
  if (auth.response) return auth.response;
  if (!auth.state.finalizedAt) return NextResponse.json({ error: 'Finish submitting first.' }, { status: 409 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 });
  }
  const corrections = (Array.isArray(body?.noteCorrections) ? body.noteCorrections : [])
    .filter((c) => c && typeof c.comment === 'string' && c.comment.trim())
    .slice(0, MAX_CORRECTIONS)
    .map((c) => ({
      id: String(c.id || '').slice(0, 40),
      excerpt: String(c.excerpt || '').slice(0, 600),
      comment: c.comment.trim().slice(0, 2000),
      createdAt: c.createdAt || new Date().toISOString(),
    }));

  try {
    const stored = await loadIntake(params.id);
    if (!stored) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    let intake = stored;
    // The patient may also have gone back and changed answers; take the new
    // answers but keep the server-owned parts (submission bookkeeping and the
    // list of records that were actually uploaded).
    if (body?.intakeData && typeof body.intakeData === 'object') {
      const d = body.intakeData.demographics || {};
      if (!String(d.firstName || '').trim() || !String(d.lastName || '').trim() || !/^\d{4}-\d{2}-\d{2}$/.test(String(d.dob || ''))) {
        return NextResponse.json({ error: 'Name and date of birth are required.' }, { status: 422 });
      }
      const { submission: _s, generatedSummary: _g, documents: _d, ...fresh } = body.intakeData;
      intake = { ...fresh, documents: stored.documents || [], submission: stored.submission };
    }
    intake.noteCorrections = corrections;
    await saveIntake(params.id, intake);
    await markPending(params.id);
    await dispatch(params.id, { regenerate: true });
    logEvent('rewrite.requested', { submissionId: params.id, corrections: corrections.length });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('rewrite.failed', err, { submissionId: params.id });
    return NextResponse.json({ error: 'Could not save your corrections right now.' }, { status: 500 });
  }
}
