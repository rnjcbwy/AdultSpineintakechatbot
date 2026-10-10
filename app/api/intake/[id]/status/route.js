import { NextResponse } from 'next/server';
import { authorizeSubmission } from '../../../../../lib/server/submissionAuth';
import { loadNote } from '../../../../../lib/server/submissionStore';
import { practiceHubConfigured } from '../../../../../lib/server/practicehub';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/intake/:id/status — what the patient's browser polls after
 * submitting: is the note ready, and has the office received the form.
 */
export async function GET(request, { params }) {
  const auth = await authorizeSubmission(request, params.id);
  if (auth.response) return auth.response;
  const { state } = auth;
  const note = await loadNote(params.id);
  return NextResponse.json({
    id: params.id,
    status: state.status,
    finalized: !!state.finalizedAt,
    note: note ? { narrative: note.narrative, generatedAt: note.generatedAt, sourceFingerprint: note.sourceFingerprint } : null,
    delivered: state.status === 'delivered',
    handoffConfigured: practiceHubConfigured(),
    attempts: state.attempts || 0,
    error: state.lastError ? { step: state.lastError.step, at: state.lastError.at } : null,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
