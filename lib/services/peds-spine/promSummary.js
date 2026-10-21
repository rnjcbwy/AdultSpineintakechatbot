// The child's version of promSummary: the same resolution of answers back to
// the sentences the family chose (see the adult module for why), over the
// pediatric instrument set, which adds the SAQ and the EOSQ-24 to the adult
// spine questionnaires. The adult module is bound to the adult instrument
// table, so everything is restated here rather than re-exported. Same export
// names as the adult module.

import { QUESTIONNAIRES, scoreQuestionnaire } from './questionnaires';

const BY_ID = QUESTIONNAIRES;

/** Instruments whose individual items are themselves clinical findings. */
const ITEMS_ARE_FINDINGS = new Set(['mjoa']);

/** Which end of each scale is the bad end: ODI and NDI count up with disability; the rest count up with function. */
const HIGHER_IS_WORSE = new Set(['odi', 'ndi']);

/** The two mean-scored pediatric instruments. */
const MEAN_SCORED = new Set(['saq', 'eosq24']);

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
  if (MEAN_SCORED.has(id)) {
    return `${score.totalScore} of 5 — ${score.interpretation} (${score.answered} of ${score.total} items answered)`;
  }
  return null;
}

/**
 * Resolve stored answers back into the sentences the family selected.
 * @returns [{ id, name, shortName, score, headline, itemsAreFindings, items, domainScores }]
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
      domainScores: score?.domainScores || null,
    });
  }
  return out;
}

/** The PROM block for the note prompt, pre-resolved into words. */
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
    if (d.id === 'saq') {
      lines.push('  NOTE: the SAQ is the adolescent\'s own view of their appearance, scored 1 to 5 with 5 best; report it as a cosmetic and psychosocial concern, as function and self-image, in the history.');
    }
    if (d.id === 'eosq24') {
      lines.push('  NOTE: the EOSQ-24 is parent-reported, scored 1 to 5 with 5 best; its breathing, transfer, daily-living and pain items are history and belong in the history of present illness.');
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

// The score preview the form shows while the family is answering; the shape
// is the adult module's ({ big, small, count, interpretation, tone, domains }).

const ODI_NDI_TONE = {
  'Minimal disability': 'green',
  'Moderate disability': 'yellow',
  'Severe disability': 'orange',
  'Crippled': 'red',
};
const MJOA_TONE = {
  'No myelopathy': 'green',
  'Mild myelopathy': 'yellow',
  'Moderate myelopathy': 'orange',
  'Severe myelopathy': 'red',
};
const MEAN_TONE = (score) => (score >= 4 ? 'green' : score >= 3 ? 'yellow' : 'orange');

export function scorePreview(id, score, t = (s) => s) {
  if (!score) return null;
  if (id === 'odi' || id === 'ndi') {
    return {
      big: `${score.percentage}%`,
      count: `(${score.sectionsAnswered} ${t('of')} ${BY_ID[id].sections.length} ${t('sections')})`,
      interpretation: score.interpretation,
      tone: ODI_NDI_TONE[score.interpretation] || 'red',
    };
  }
  if (id === 'mjoa') {
    return {
      big: String(score.totalScore),
      small: `/ ${score.maxScore}`,
      interpretation: score.interpretation,
      tone: MJOA_TONE[score.interpretation] || 'gray',
    };
  }
  if (id === 'srs22r') {
    return {
      big: score.totalScore ? String(score.totalScore) : '',
      small: `/ 5.0 ${t('overall mean')}`,
      domains: Object.values(score.domainScores || {}).map((d) => ({ name: d.name, score: d.score })),
    };
  }
  if (id === 'eosq24') {
    return {
      big: String(score.totalScore),
      small: `/ 5.0 ${t('overall mean')}`,
      domains: Object.values(score.domainScores || {}).map((d) => ({ name: d.name, score: d.score })),
    };
  }
  if (id === 'saq') {
    return {
      big: String(score.totalScore),
      small: `/ 5.0 ${t('mean')}`,
      count: `(${score.answered} ${t('of')} ${score.total} ${t('items')})`,
      interpretation: score.interpretation,
      tone: MEAN_TONE(score.totalScore),
    };
  }
  return null;
}
