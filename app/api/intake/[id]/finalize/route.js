import { NextResponse } from 'next/server';
import { authorizeSubmission } from '../../../../../lib/server/submissionAuth';
import { saveState } from '../../../../../lib/server/submissionStore';
import { dispatch } from '../../../../../lib/server/intakeDispatch';
import { logError, logEvent } from '../../../../../lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/:id/finalize — the browser has finished uploading.
 * Marks the submission complete and starts the worker (note, transcript,
 * hand-off to the office). Idempotent.
 */
export async function POST(request, { params }) {
  const auth = await authorizeSubmission(request, params.id);
  if (auth.response) return auth.response;
  const { state } = auth;

  if (!state.finalizedAt) {
    state.finalizedAt = new Date().toISOString();
    await saveState(params.id, state);
    logEvent('submit.finalized', { submissionId: params.id });
  }
  try {
    await dispatch(params.id);
  } catch (err) {
    // The sweep will pick it up; the patient's data is already safe.
    logError('finalize.dispatch_failed', err, { submissionId: params.id });
  }
  return NextResponse.json({ ok: true, status: state.status });
}
