// ============================================================================
// PHI-safe server logging.
//
// Everything this app handles server-side is protected health information, and
// the old routes logged raw provider error bodies and exception messages, which
// can echo request content. Under HIPAA, CloudWatch is a system of record like
// any other, so nothing that could carry patient data may be written to it.
//
// Rules: log an event name, an opaque identifier, and an error CLASS. Never log
// request bodies, prompts, model output, file names, or exception messages
// from code paths that touched patient data.
// ============================================================================

function errorCode(err) {
  if (!err) return 'unknown';
  const name = err.name || err.constructor?.name || 'Error';
  const status = err.$metadata?.httpStatusCode || err.status || err.statusCode;
  const code = err.code || err.Code;
  return [name, code, status].filter(Boolean).join('/');
}

/** Structured, PHI-free log line. `fields` must only hold ids, counts, codes. */
export function logEvent(event, fields = {}) {
  const line = { t: new Date().toISOString(), event, ...fields };
  console.log(JSON.stringify(line));
}

export function logError(event, err, fields = {}) {
  const line = { t: new Date().toISOString(), event, level: 'error', error: errorCode(err), ...fields };
  // In development the message is useful and the data is fictional; in
  // production it is withheld on principle.
  if (process.env.NODE_ENV !== 'production' && err?.message) line.devMessage = String(err.message).slice(0, 300);
  console.error(JSON.stringify(line));
}

export { errorCode };
