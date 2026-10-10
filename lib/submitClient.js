// ============================================================================
// Browser side of a submission.
//
//   1. POST the answers            -> id, token, one upload instruction per file
//   2. upload each record          -> straight to S3 (prod) or the app (dev)
//   3. POST finalize               -> the office's worker takes over
//   4. poll status                 -> the note appears when it is written
//
// Everything after step 1 is retryable; the token is what lets this browser
// (and only this browser) read the result back.
// ============================================================================

'use client';

import { getDocumentBlob } from './documents';

async function readError(res, fallback) {
  try {
    const j = await res.json();
    return j.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Submit the answers and upload the attached records.
 * `onProgress({ phase, done, total })` is called as uploads proceed.
 */
export async function submitIntake(data, { onProgress } = {}) {
  const res = await fetch('/api/intake/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intakeData: data }),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not submit the form.'));
  const { id, token, uploads = [], redFlags = [] } = await res.json();

  const total = uploads.filter((u) => !u.skipped).length;
  let done = 0;
  let uploaded = 0;
  const skipped = [];
  for (const u of uploads) {
    if (u.skipped) { skipped.push(u.docId); continue; }
    onProgress?.({ phase: 'uploading', done, total });
    try {
      const blob = await getDocumentBlob(u.docId);
      if (!blob) { skipped.push(u.docId); continue; }
      const r = await (u.local
        ? fetch(u.url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: (() => { const fd = new FormData(); fd.append('file', blob); return fd; })() })
        : fetch(u.url, { method: u.method || 'PUT', headers: u.headers || {}, body: blob }));
      if (r.ok) uploaded++;
      else skipped.push(u.docId);
    } catch {
      skipped.push(u.docId);
    } finally {
      done++;
    }
  }
  onProgress?.({ phase: 'finalizing', done, total });

  try {
    await finalizeSubmission(id, token);
  } catch (err) {
    // The answers are already stored under this id; hand it back so the
    // caller can retry the last step instead of submitting again.
    err.submission = { id, token, uploaded, skipped };
    throw err;
  }

  return { id, token, redFlags, uploaded, skipped };
}

/** Tell the server the uploads are done. Idempotent; safe to call again after a failure. */
export async function finalizeSubmission(id, token) {
  const fin = await fetch(`/api/intake/${id}/finalize`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!fin.ok) throw new Error(await readError(fin, 'Could not complete the submission.'));
  return fin.json();
}

export async function fetchStatus(id, token) {
  const res = await fetch(`/api/intake/${id}/status`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(await readError(res, 'Could not check the status.'));
  return res.json();
}

/**
 * Poll until `until(status)` is true or the time runs out. Returns the last
 * status seen either way, so the caller can still show what it knows.
 */
export async function pollStatus(id, token, { until, timeoutMs = 240_000, intervalMs = 3000, onTick } = {}) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < timeoutMs) {
    try {
      last = await fetchStatus(id, token);
      onTick?.(last);
      if (until(last)) return last;
    } catch {
      // transient; keep polling
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return last;
}

export async function requestRewrite(id, token, { intakeData, noteCorrections }) {
  const res = await fetch(`/api/intake/${id}/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ intakeData, noteCorrections }),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not save your corrections.'));
  return res.json();
}
