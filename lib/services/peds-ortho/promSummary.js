// ============================================================================
// The PROMIS pediatric forms as history, not just as a score.
//
// Same shape as the adult ortho module (headline, promDetail,
// summarizePROMsForPrompt, promHeadlines, scorePreview), written against the
// pediatric instruments. Each item's answer is resolved back to the sentence
// the child or parent chose, because "My child could run a mile: Not able
// to do" is a functional finding in its own right.
// ============================================================================

import { QUESTIONNAIRES, scoreQuestionnaire } from './questionnaires';

const BY_ID = QUESTIONNAIRES;

/** Headline figure for an instrument, as a short string. */
export function headline(id, score) {
  if (!score) return null;
  const q = BY_ID[id];
  const direction = q?.higherIsBetter ? 'higher = better function' : 'higher = pain interfered more';
  const raw = `raw ${score.rawScore} of ${score.maxRaw} (${direction})`;
  if (score.tScore != null) return `T-score ${score.tScore}; ${raw}`;
  if (score.incomplete) return `${raw} — incomplete, ${score.itemsAnswered} of ${score.itemsTotal} items answered`;
  return raw;
}

/**
 * Resolve stored answers back into the sentences the respondent selected.
 *
 * @returns [{ id, name, shortName, score, headline, itemsAreFindings, items }]
 */
export function promDetail(proms) {
  const out = [];
  for (const [id, entry] of Object.entries(proms || {})) {
    const q = BY_ID[id];
    if (!q || !entry) continue;
    const answers = entry.answers || {};
    if (!Object.keys(answers).length) continue;
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
        // The bad end of the scale: the lowest value on a function form, the highest on pain interference.
        worst: value === (q.higherIsBetter ? Math.min(...scores) : Math.max(...scores)),
      });
    }

    out.push({
      id,
      name: q.name,
      shortName: q.shortName,
      score,
      headline: headline(id, score),
      // Every PROMIS item is a functional finding a surgeon would ask for out loud.
      itemsAreFindings: true,
      items,
      domainScores: null,
    });
  }
  return out;
}

/** The PROM block for the note prompt, pre-resolved into words. */
export function summarizePROMsForPrompt(proms) {
  const detail = promDetail(proms);
  if (!detail.length) return 'None completed (no validated PROMIS pediatric form for this age, or not reached).';

  const parts = [];
  for (const d of detail) {
    const lines = [`${d.name}: ${d.headline || 'score not calculated'}`];
    for (const item of d.items) lines.push(`  - ${item.title}: "${item.answer}"`);
    lines.push('  NOTE: these are PROMIS Pediatric short forms scored 1 to 5 per item. Report the raw score out of its maximum exactly as given; do not describe it as a T-score, a percentile or a norm, and do not invent cutoffs. Report a T-score only when one is listed.');
    parts.push(lines.join('\n'));
  }
  return parts.join('\n\n');
}

/** One-line-per-instrument headline, for compact UI. */
export function promHeadlines(proms) {
  return promDetail(proms).map((d) => ({ id: d.id, shortName: d.shortName, name: d.name, headline: d.headline }));
}

/**
 * The score preview the form shows while the family is answering:
 *   { big, small, count, interpretation, tone, domains, srText }
 */
export function scorePreview(id, score, t = (s) => s) {
  if (!score) return null;
  const big = score.tScore != null ? String(score.tScore) : String(score.rawScore);
  const small = score.tScore != null ? t('T-score') : `/ ${score.maxRaw} ${t('raw score')}`;
  return {
    big,
    small,
    count: `(${score.itemsAnswered} ${t('of')} ${score.itemsTotal} ${t('items')} ${t('answered')})`,
    interpretation: score.incomplete ? t('Incomplete') : t(score.interpretation),
    tone: score.incomplete ? 'muted' : 'teal',
    domains: null,
    srText: headline(id, score),
  };
}
