// ============================================================================
// PROMs as history, not just as a score.
//
// The questionnaires store an answer as the option's numeric value —
// { stairs: 3 } — and a bare 3 means nothing without the option list. The
// item-level content is functional history: the KOOS JR stairs item is the
// same fact a surgeon would ask for out loud, and it is also the functional
// limitation a prior-authorisation reviewer wants documented.
//
// So answers are resolved back to the sentence the patient chose, and handed
// over in readable form.
// ============================================================================

import { QUESTIONNAIRES, scoreQuestionnaire } from './questionnaires';

const BY_ID = QUESTIONNAIRES;

/** Instruments whose individual items are themselves clinical findings. */
const ITEMS_ARE_FINDINGS = new Set();

/**
 * Which end of each scale is the bad end.
 *
 * QuickDASH, HOOS JR and KOOS JR count UP with disability (the top option is
 * the worst), while LEFS counts UP with function (4 = no difficulty). Stated
 * per instrument rather than inferred from option order, so re-ordering an
 * option list cannot invert it.
 */
const HIGHER_IS_WORSE = new Set(['quickdash', 'hoos_jr', 'koos_jr']);

/** Headline figure for an instrument, as a short string. */
export function headline(id, score) {
  if (!score) return null;
  if (id === 'quickdash') {
    return `${score.score} of 100 — ${score.interpretation}${score.incomplete ? '' : ` (${score.itemsAnswered} of ${score.itemsTotal} items answered)`}`;
  }
  if (id === 'hoos_jr' || id === 'koos_jr') {
    if (score.interval != null) return `${score.interval} of 100 (interval score; 100 = no problems)`;
    return `raw ${score.rawScore} of ${score.maxPossible} — ${score.interpretation}`;
  }
  if (id === 'lefs') {
    return `${score.totalScore} of ${score.maxScore} — ${score.interpretation}`;
  }
  return null;
}

/**
 * Resolve stored answers back into the sentences the patient selected.
 *
 * @returns [{ id, name, shortName, score, headline, itemsAreFindings, items }]
 *   items: [{ id, title, answer, value, worst }]
 */
export function promDetail(proms) {
  const out = [];
  for (const [id, entry] of Object.entries(proms || {})) {
    const q = BY_ID[id];
    if (!q || !entry) continue;
    const answers = entry.answers || {};
    if (!Object.keys(answers).length) continue;

    // Stored scores can be stale if the questionnaire was edited; recompute.
    const score = scoreQuestionnaire(id, answers) || entry.score || null;

    const items = [];
    for (const section of q.sections || []) {
      const value = answers[section.id];
      if (value === null || value === undefined) continue;
      const option = (section.options || []).find((o) => o.score === value);
      if (!option) continue;
      const scores = (section.options || []).map((o) => o.score);
      items.push({
        id: section.id,
        title: section.title,
        answer: option.label,
        value,
        // Normalised so a reader (and the UI highlight) can tell a bad answer
        // from a good one without knowing which way this instrument runs.
        worst: value === (HIGHER_IS_WORSE.has(id) ? Math.max(...scores) : Math.min(...scores)),
      });
    }

    out.push({
      id,
      name: q.name,
      shortName: q.shortName,
      score,
      headline: headline(id, score),
      itemsAreFindings: ITEMS_ARE_FINDINGS.has(id),
      items,
      domainScores: null,
    });
  }
  return out;
}

/**
 * The PROM block for the note prompt.
 *
 * Handed over the same way the pain map is: pre-resolved into words, because
 * the raw intake JSON underneath carries only answer codes.
 */
export function summarizePROMsForPrompt(proms) {
  const detail = promDetail(proms);
  if (!detail.length) return 'None completed.';

  const parts = [];
  for (const d of detail) {
    const lines = [`${d.name}: ${d.headline || 'score not calculated'}`];
    for (const item of d.items) {
      lines.push(`  - ${item.title}: "${item.answer}"`);
    }
    if (d.id === 'hoos_jr' || d.id === 'koos_jr') {
      lines.push('  NOTE: report the raw sum exactly as given above; do not convert it to an interval score.');
    }
    parts.push(lines.join('\n'));
  }
  return parts.join('\n\n');
}

/** One-line-per-instrument headline, for compact UI. */
export function promHeadlines(proms) {
  return promDetail(proms).map((d) => ({
    id: d.id,
    shortName: d.shortName,
    name: d.name,
    headline: d.headline,
  }));
}
