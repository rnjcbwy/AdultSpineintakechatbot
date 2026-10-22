// ============================================================================
// Submission worker.
//
// Everything that happens AFTER the patient's answers are safely stored:
//   1. write the pre-visit note with the model (slow: tens of seconds)
//   2. render the transcript PDF
//   3. hand the bundle to Practice Hub
//
// It runs in a Lambda in production (the web tier's response window is too
// short for step 1) and in-process during local development. Every step is
// idempotent and keyed on a fingerprint of the answers, so re-running after a
// failure, or after the patient corrects the note, only redoes what changed.
//
// The model is the least reliable link, so it never blocks the office: if the
// note cannot be written, the transcript and the records still go to Practice
// Hub now, and the note follows as an update when a retry succeeds.
// ============================================================================

import crypto from 'node:crypto';
import { getService } from '../service';

/** The spine or the bone-and-joint rules and note prompt, by the intake's service. */
const serviceOf = (intake) => getService(intake?.service?.key);
const detectRedFlags = (intake) => serviceOf(intake).redFlags.detectRedFlags(intake);
import { fingerprintAnswers } from '../noteFingerprint';
import { isExpressLead, expressLeadNarrative } from '../express';
import { complete } from './llm';
import { buildIntakeTranscriptPdf } from './intakeTranscriptPdf';
import { forwardSubmission, practiceHubConfigured } from './practicehub';
import { sendEducationEmail } from './education';
import { errorCode, logError, logEvent } from './log';
import {
  loadIntake, loadState, saveState, loadNote, saveNote, saveTranscript, loadTranscript,
  listAttachments, getObject, clearPending, markPending, listPending,
} from './submissionStore';

/** Fingerprint of what the note depends on: the answers plus the corrections. */
export function noteFingerprint(intake) {
  const corrections = (intake.noteCorrections || []).map((c) => `${c.excerpt || ''}|${c.comment || ''}`).join('\n');
  return `${fingerprintAnswers(intake)}:${crypto.createHash('sha1').update(corrections).digest('hex').slice(0, 12)}`;
}

export async function generateNote(intake) {
  // An express request has no history to summarise; its note is the lead
  // itself, written here so it never waits on the model.
  if (isExpressLead(intake)) {
    return {
      narrative: expressLeadNarrative(intake, detectRedFlags(intake)),
      generatedAt: new Date().toISOString(),
      modelId: 'none',
      provider: 'express',
      sourceFingerprint: noteFingerprint(intake),
    };
  }
  const r = await complete({
    purpose: 'note',
    system: serviceOf(intake).prompts.NOTE_SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: serviceOf(intake).prompts.buildSummaryPrompt(intake) }],
    maxTokens: 4000,
    temperature: 0.3,
  });
  return {
    narrative: r.text,
    generatedAt: new Date().toISOString(),
    modelId: r.modelId,
    provider: r.provider,
    sourceFingerprint: noteFingerprint(intake),
  };
}

/**
 * Process one submission end to end. Safe to call repeatedly.
 * @returns {Promise<object>} the saved state
 */
export async function processSubmission(id, { regenerate = false } = {}) {
  const [state, intake] = await Promise.all([loadState(id), loadIntake(id)]);
  if (!state || !intake) throw Object.assign(new Error('Submission not found'), { name: 'NotFound' });
  if (!state.finalizedAt) {
    logEvent('worker.skip_unfinalized', { submissionId: id });
    return state;
  }
  state.attempts = (state.attempts || 0) + 1;
  state.lastRunAt = new Date().toISOString();
  state.lastError = null;
  const fp = noteFingerprint(intake);
  const redFlags = detectRedFlags(intake);
  state.redFlagCount = redFlags.length;

  // 1. Note ------------------------------------------------------------------
  let note = await loadNote(id);
  if (note && (regenerate || note.sourceFingerprint !== fp)) note = null;
  if (!note) {
    try {
      note = await generateNote(intake);
      await saveNote(id, note);
      state.noteGeneratedAt = note.generatedAt;
      state.noteModel = note.modelId;
      state.noteError = null;
      if (state.status === 'received') state.status = 'noted';
      logEvent('worker.note_written', { submissionId: id, modelId: note.modelId });
    } catch (err) {
      note = null;
      state.noteError = { code: errorCode(err), at: new Date().toISOString() };
      state.lastError = { step: 'note', code: errorCode(err), at: state.noteError.at };
      logError('worker.note_failed', err, { submissionId: id, attempt: state.attempts });
    }
  }
  await saveState(id, state);

  // What the office has must reflect the answers, the files AND whether the
  // note made it; any change re-delivers.
  const attachments = await listAttachments(id, intake);
  const deliveryKey = `${fp}:${attachments.length}:${note?.generatedAt || 'no-note'}`;

  try {
    // 2. Transcript -----------------------------------------------------------
    let transcript = null;
    if (state.transcriptKey !== deliveryKey) {
      transcript = await buildIntakeTranscriptPdf({
        intake, note, redFlags, attachments,
        meta: { submissionId: id, submittedAt: state.finalizedAt || state.createdAt },
      });
      await saveTranscript(id, transcript);
      state.transcriptKey = deliveryKey;
      state.transcriptBytes = transcript.length;
      logEvent('worker.transcript_written', { submissionId: id, bytes: transcript.length, attachments: attachments.length, withNote: !!note });
    }
    await saveState(id, state);

    // 3. Hand-off -------------------------------------------------------------
    if (!practiceHubConfigured()) {
      state.status = note ? 'stored' : state.status;
      state.handoff = { configured: false };
    } else if (state.deliveredKey !== deliveryKey) {
      const pdf = transcript || (await loadTranscript(id))?.body;
      const reply = await forwardSubmission({
        id, intake, note, redFlags, transcriptPdf: pdf, attachments,
        submittedAt: state.finalizedAt || state.createdAt,
        loadAttachment: async (a) => (await getObject(a.key))?.body || null,
      });
      state.status = 'delivered';
      state.deliveredAt = new Date().toISOString();
      state.deliveredKey = deliveryKey;
      state.deliveredWithNote = !!note;
      state.handoff = {
        configured: true,
        intakeId: reply?.intakeId || null,
        patientId: reply?.patientId || null,
        patientStatus: reply?.patientStatus || null,
        version: reply?.version || null,
      };
    }
  } catch (err) {
    state.lastError = { step: state.transcriptKey === deliveryKey ? 'forward' : 'transcript', code: errorCode(err), at: new Date().toISOString() };
    logError('worker.failed', err, { submissionId: id, step: state.lastError.step, attempt: state.attempts });
  }

  // 4. Thank-you email with patient education (once; never holds anything up).
  if (state.finalizedAt && !state.educationEmail?.sent) {
    const r = await sendEducationEmail(id, intake);
    if (r.reason !== 'not-applicable') state.educationEmail = { ...r, sent: r.sent || r.reason === 'already-sent', at: new Date().toISOString() };
  }

  // Done only when the office has the current version AND the note exists;
  // otherwise the sweep comes back for it.
  const complete = !!note && (state.handoff?.configured === false || state.deliveredKey === deliveryKey);
  if (complete) await clearPending(id);
  else await markPending(id);
  await saveState(id, state);
  return state;
}

/**
 * Re-run anything still marked pending. Called on a schedule so a Practice Hub
 * outage or a model hiccup never loses a submission.
 */
export async function sweepPending({ olderThanMs = 2 * 60 * 1000, maxAttempts = 50 } = {}) {
  const ids = await listPending();
  const out = { scanned: ids.length, processed: 0, completed: 0, skipped: 0 };
  for (const id of ids) {
    const state = await loadState(id);
    if (!state) { out.skipped++; continue; }
    const last = Date.parse(state.lastRunAt || state.createdAt || 0);
    if (Date.now() - last < olderThanMs || (state.attempts || 0) >= maxAttempts || !state.finalizedAt) { out.skipped++; continue; }
    const s = await processSubmission(id);
    out.processed++;
    if (!s.lastError && s.noteGeneratedAt) out.completed++;
  }
  logEvent('worker.sweep', out);
  return out;
}
