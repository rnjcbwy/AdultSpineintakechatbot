// ============================================================================
// Hand a submission to the worker.
//
// Production: an asynchronous Lambda invocation (INTAKE_WORKER_FUNCTION). The
// web tier returns immediately and the patient's browser polls for the note.
// Development: the same code runs in this process, fire-and-forget.
// ============================================================================

import { logError, logEvent } from './log';

export function workerMode() {
  return process.env.INTAKE_WORKER_FUNCTION ? 'lambda' : 'inline';
}

export async function dispatch(submissionId, { regenerate = false } = {}) {
  if (workerMode() === 'lambda') {
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    await client.send(new InvokeCommand({
      FunctionName: process.env.INTAKE_WORKER_FUNCTION,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify({ submissionId, regenerate })),
    }));
    logEvent('dispatch.lambda', { submissionId, regenerate });
    return;
  }
  const { processSubmission } = await import('./intakeWorker');
  logEvent('dispatch.inline', { submissionId, regenerate });
  processSubmission(submissionId, { regenerate }).catch((err) => logError('dispatch.inline_failed', err, { submissionId }));
}
