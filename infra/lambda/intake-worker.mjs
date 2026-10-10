// Lambda entry point for the submission worker.
//
// Invoked asynchronously by the web tier ({ submissionId, regenerate }) and on
// a schedule by EventBridge ({ sweep: true }) to retry anything undelivered.
// Bundled by CDK (esbuild) together with the app's lib/ code, so the note
// prompt, the transcript renderer and the hand-off are the same code the
// development server runs.
import { processSubmission, sweepPending } from '../../lib/server/intakeWorker';
import { logEvent } from '../../lib/server/log';

export async function handler(event) {
  const payload = typeof event === 'string' ? JSON.parse(event) : event || {};
  if (payload.sweep || payload.source === 'aws.events' || payload['detail-type']) {
    return sweepPending();
  }
  const { submissionId, regenerate } = payload;
  if (!submissionId) {
    logEvent('worker.bad_event');
    return { ok: false };
  }
  const state = await processSubmission(submissionId, { regenerate: !!regenerate });
  return { ok: true, status: state.status, error: state.lastError?.code || null };
}
