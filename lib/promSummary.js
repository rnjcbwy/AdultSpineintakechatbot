// ============================================================================
// PROMs as history, not just as a score.
//
// The questionnaires store an answer as the option's numeric value —
// { walking: 4 } — and the note generator was handed that raw. A bare 4 means
// nothing without the option list, so the item-level content never reached the
// note at all: the model could echo "ODI 44%, severe disability" and not one
// word of what the patient actually reported. Everything the patient told us
// about walking, sleeping, lifting and dressing was collected and discarded.
//
// These are outcome measures, but the items are functional history. The ODI
// walking item is the same fact a surgeon would ask for out loud, and it is
// also the functional limitation a prior-authorisation reviewer wants
// documented. mJOA is the clearest case: hand dexterity, gait and sphincter
// function are a myelopathy history, and a total score hides the finding.
//
// So answers are resolved back to the sentence the patient chose, and handed
// over in readable form.
// ============================================================================

import { ODI, NDI, MJOA, SRS22R, scoreOdiNdi, scoreMJOA, scoreSRS22R } from './questionnaires';

const BY_ID = { odi: ODI, ndi: NDI, mjoa: MJOA, srs22r: SRS22R };

/** Instruments whose individual items are themselves clinical findings. */
const ITEMS_ARE_FINDINGS = new Set(['mjoa']);

/**
 * Which end of each scale is the bad end.
 *
 * The instruments disagree, and silently: ODI and NDI count UP with disability
 * (5 = worst), while mJOA counts DOWN with function (0 = worst) and SRS-22r
 * runs 1-5 with 5 best. Assuming one direction flags the healthiest answers as
 * abnormal on half the questionnaires. Stated per instrument rather than
 * inferred from option order, so re-ordering an option list cannot invert it.
 */
const HIGHER_IS_WORSE = new Set(['odi', 'ndi']);

function scoreFor(id, answers) {
  if (!answers || !Object.keys(answers).length) return null;
  if (id === 'odi') return scoreOdiNdi(answers, ODI);
  if (id === 'ndi') return scoreOdiNdi(answers, NDI);
  if (id === 'mjoa') return scoreMJOA(answers);
  if (id === 'srs22r') return scoreSRS22R(answers);
  return null;
}

/** Headline figure for an instrument, as a short string. */
export function headline(id, score) {
  if (!score) return null;
  if (id === 'odi' || id === 'ndi') {
    return `${score.percentage}% — ${score.interpretation} (${score.sectionsAnswered} of 10 sections answered)`;
  }
  if (id === 'mjoa') return `${score.totalScore} of ${score.maxScore} — ${score.interpretation}`;
  if (id === 'srs22r') {
    const t = score.totalScore != null ? `${score.totalScore} of 5` : '';
    return [t, score.interpretation].filter(Boolean).join(' — ');
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
    const score = scoreFor(id, answers) || entry.score || null;

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
      // SRS-22r is scored by domain; its 22 items mean little individually.
      domainScores: score?.domainScores || null,
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

    if (d.domainScores) {
      for (const dom of Object.values(d.domainScores)) {
        lines.push(`  - ${dom.name}: ${dom.score} of 5`);
      }
    }

    for (const item of d.items) {
      lines.push(`  - ${item.title}: "${item.answer}"`);
    }

    if (d.itemsAreFindings) {
      lines.push(
        '  NOTE: these items are a myelopathy history (hand dexterity, gait, ' +
        'sphincter function), not merely questionnaire responses. Report them ' +
        'in the history, not only as a total score.'
      );
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
