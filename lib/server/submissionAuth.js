// ============================================================================
// Per-submission access for the patient's own browser.
//
// A submission id alone must not open the record, so each submission issues a
// random bearer token at creation; only its hash is stored. The token lives in
// the patient's browser (with the rest of their draft) and is sent on the
// status, upload, finalize and rewrite calls.
// ============================================================================

import { isSubmissionId, loadState, tokenMatches } from './submissionStore';

/**
 * @returns {Promise<{state:object}|{response:Response}>}
 */
export async function authorizeSubmission(request, id) {
  if (!isSubmissionId(id)) return { response: Response.json({ error: 'Not found.' }, { status: 404 }) };
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const state = await loadState(id);
  if (!state) return { response: Response.json({ error: 'Not found.' }, { status: 404 }) };
  if (!tokenMatches(token, state.accessTokenHash)) {
    return { response: Response.json({ error: 'Not authorized.' }, { status: 401 }) };
  }
  return { state };
}
