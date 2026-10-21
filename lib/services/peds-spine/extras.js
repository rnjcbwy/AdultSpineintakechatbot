// Pediatric additions the shared pages render generically: everything the
// `spine-history` step stores under data.pedsSpine, resolved to [label, value]
// rows (lib/services/peds-spine/pedsHistory.js).

import { pedsHistoryBlocks, pedsSectionFor, SPINE_HISTORY_LABELS, INTERVAL_HISTORY_LABELS, POSTOP_HISTORY_LABELS } from './pedsHistory';

/** [{ title, rows: [[label, value], ...] }] for the transcript PDF, after the shared sections. */
export function pdfSections(intake) {
  return pedsHistoryBlocks(intake?.pedsSpine).map((b) => ({ title: b.title, rows: b.rows }));
}

/** The review page shows these answers from the block the visit used; the rest is in the PDF. */
const REVIEW_KEYS = {
  history: ['diagnosis', 'goals', 'discovery', 'appearance', 'hasPain', 'nightPain', 'neuro', 'curveMeasure', 'treatments', 'braceType', 'braceHoursWorn', 'otherSpecialist', 'limited', 'peClass', 'appearanceBother'],
  interval: ['sinceLast', 'currentTreatment', 'braceHoursWorn', 'braceProblems', 'nightPain', 'neuro', 'newImaging', 'curveMeasure', 'heightChange', 'menarcheSince', 'limited', 'peClass'],
  postop: ['overall', 'incision', 'fever', 'painTrend', 'painMeds', 'bowel', 'bladder', 'appetite', 'sleep', 'walkingBalance', 'mobility', 'activities', 'satisfaction'],
};
const LABELS = { history: SPINE_HISTORY_LABELS, interval: INTERVAL_HISTORY_LABELS, postop: POSTOP_HISTORY_LABELS };

/** [{ label, value, step }] for the review page's summary, after the shared items. */
export function reviewItems(intake, t = (s) => s) {
  const section = pedsSectionFor(intake?.visit?.type);
  const answers = intake?.pedsSpine?.[section] || {};
  const labels = LABELS[section];
  const items = [];
  for (const key of REVIEW_KEYS[section]) {
    const v = answers[key];
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    items.push({
      label: t(labels[key]),
      value: Array.isArray(v) ? v.map((x) => t(x)).join(', ') : t(String(v)),
      step: 'spine-history',
    });
  }
  return items;
}
