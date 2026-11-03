// ============================================================================
// The questionnaires, for a patient answering them on a phone call with the
// office's assistant (Practice Hub, server/answering/codedIntake.ts). The
// definitions and the scoring stay here, in one place, so a call scores
// exactly as the form does.
// ============================================================================

import { getService, isServiceKey } from '../service';

const service = (key) => (isServiceKey(key) ? getService(key) : null);

/** The body regions the form's questionnaires are chosen from. */
export function regionChoices(key) {
  const s = service(key);
  return (s?.constants?.SYMPTOM_REGIONS || []).map((r) => ({ id: r.id, label: r.label }));
}

/** The questionnaires the form would give this patient, in English, ready to read aloud. */
export function applicableQuestionnaires(key, regions, dob) {
  const s = service(key);
  if (!s) return [];
  const known = new Set(regionChoices(key).map((r) => r.id));
  const intake = { service: { key }, chiefComplaint: { symptomRegions: regions.filter((r) => known.has(r)) }, demographics: { dob: dob || '' }, hpiData: {} };
  const ids = s.questionnaires.getApplicableQuestionnaires(intake) || [];
  return ids
    .map((id) => s.questionnaires.QUESTIONNAIRES[id])
    .filter((q) => q && Array.isArray(q.sections))
    .map((q) => ({
      id: q.id,
      name: q.name,
      sections: q.sections
        .filter((sec) => Array.isArray(sec.options))
        .map((sec) => ({ id: sec.id, title: sec.title, options: sec.options.map((o) => ({ score: o.score, label: o.label })) })),
    }));
}

/** Score what was answered on the call, as the form would. */
export function scoreResponses(key, responses) {
  const s = service(key);
  if (!s || !responses || typeof responses !== 'object') return [];
  const out = [];
  for (const [id, answers] of Object.entries(responses)) {
    const q = s.questionnaires.QUESTIONNAIRES[id];
    if (!q || !answers || typeof answers !== 'object') continue;
    const clean = {};
    for (const [item, v] of Object.entries(answers)) if (typeof v === 'number' && Number.isFinite(v)) clean[item] = v;
    const score = s.questionnaires.scoreQuestionnaire(id, clean);
    if (!score) continue;
    const display = s.promSummary?.headline?.(id, score) || score.interpretation || JSON.stringify(score).slice(0, 200);
    out.push({ id, name: q.name, display, score });
  }
  return out;
}
