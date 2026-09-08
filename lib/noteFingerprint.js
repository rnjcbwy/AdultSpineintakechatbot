// ============================================================================
// Has the intake changed since the note was written?
//
// A patient can submit, read the note, jump back to fix an answer, and return
// to a note that no longer matches what they said. Nothing on screen would
// admit that, which is the dangerous version: a stale note that looks current
// is worse than an obviously missing one, because the surgeon reads it as
// fact.
//
// Comparing timestamps does not work — the store stamps lastUpdated on every
// write, including saving a note correction or moving between steps, so it
// reports "changed" constantly. This fingerprints the clinical ANSWERS only.
// Bookkeeping (which step they are on, when they submitted, the note itself)
// is excluded, so the fingerprint moves if and only if the note's source
// material moved.
// ============================================================================

/**
 * Fields that are not part of the patient's history, and so must not count as
 * a change. `noteCorrections` is deliberately here: a correction has its own
 * rewrite path and should not also register as "you edited your answers".
 */
const IGNORED_KEYS = new Set([
  'sessionId',
  'createdAt',
  'lastUpdated',
  'currentStep',
  'completedSteps',
  'submittedAt',
  'generatedSummary',
  'noteCorrections',
  'redFlags',
  'language',
]);

/** Stable JSON: object keys sorted, so key order can never change the hash. */
function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
}

/** FNV-1a. Short, stable, and does not need to be cryptographic. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** A short stable id for the clinical content of an intake. */
export function fingerprintAnswers(data) {
  if (!data || typeof data !== 'object') return hash('empty');
  const subject = {};
  for (const key of Object.keys(data)) {
    if (IGNORED_KEYS.has(key)) continue;
    subject[key] = data[key];
  }
  return hash(stable(subject));
}

/**
 * True when the answers have moved on from the note that was generated.
 *
 * Returns false for a note generated before fingerprinting existed: an
 * unknown fingerprint is not evidence of a change, and nagging every patient
 * with an older note would train them to ignore the warning.
 */
export function isNoteStale(data, summary) {
  if (!summary || !summary.sourceFingerprint) return false;
  return fingerprintAnswers(data) !== summary.sourceFingerprint;
}
