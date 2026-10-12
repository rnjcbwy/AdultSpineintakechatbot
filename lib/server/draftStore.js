// ============================================================================
// Saved drafts: "finish later on another device".
//
// The form auto-saves in the browser it was started in. A patient who wants
// to carry on elsewhere (started at home on a laptop, finishing on a phone
// in the waiting room) asks for a link. The answers so far are stored under
// a random draft id in the same encrypted store as submissions, and the link
// carries a bearer code whose hash is kept with the draft. The link is the
// only way in; it expires after DRAFT_DAYS and is removed once the intake is
// submitted. Attached records are not part of the draft: their bytes live in
// the browser that uploaded them.
//
//   drafts/<id>/draft.json   { intake, savedAt, expiresAt, tokenHash }
// ============================================================================

import crypto from 'node:crypto';
import { saveJson, loadJson, deleteObject, hashToken, tokenMatches } from './submissionStore';

export const DRAFT_DAYS = 30;
export const MAX_DRAFT_BYTES = 2 * 1024 * 1024;

const key = (id) => `drafts/${id}/draft.json`;

export function newDraftId() {
  return `d${crypto.randomBytes(9).toString('hex')}`;
}

export function isDraftId(id) {
  return typeof id === 'string' && /^d[0-9a-f]{18}$/.test(id);
}

export function newDraftToken() {
  return crypto.randomBytes(18).toString('base64url');
}

/** "id.token" as it appears in the link. */
export function parseCode(code) {
  const m = /^(d[0-9a-f]{18})\.([A-Za-z0-9_-]{20,40})$/.exec(String(code || ''));
  return m ? { id: m[1], token: m[2] } : null;
}

/** The fields a draft keeps. Server-owned and device-bound things are dropped. */
export function cleanForDraft(intake) {
  const { submission, generatedSummary, draft, documents, ...rest } = intake || {};
  return { ...rest, documents: [] };
}

/** Create a draft, or overwrite one the caller holds the code for. */
export async function saveDraft(intake, existing) {
  let id, token;
  if (existing) {
    const current = await loadJson(key(existing.id));
    if (!current || !tokenMatches(existing.token, current.tokenHash)) return null;
    id = existing.id;
    token = existing.token;
  } else {
    id = newDraftId();
    token = newDraftToken();
  }
  const now = Date.now();
  await saveJson(key(id), {
    intake: cleanForDraft(intake),
    savedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DRAFT_DAYS * 86_400_000).toISOString(),
    tokenHash: hashToken(token),
  });
  return { id, token };
}

/** The draft behind a code, or null when the code is wrong or expired. */
export async function loadDraft(code) {
  const parsed = parseCode(code);
  if (!parsed) return null;
  const d = await loadJson(key(parsed.id));
  if (!d || !tokenMatches(parsed.token, d.tokenHash)) return null;
  if (new Date(d.expiresAt).getTime() < Date.now()) return null;
  return { id: parsed.id, token: parsed.token, intake: d.intake, savedAt: d.savedAt };
}

export async function deleteDraft(id) {
  if (!isDraftId(id)) return;
  await deleteObject(key(id)).catch(() => {});
}
