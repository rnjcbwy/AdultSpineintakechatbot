// How the pediatric spine service shapes the flow (lib/flows.js).
//
// A child's spine visit adds three steps to the adult spine flow:
//   growth           right after demographics: height, weight, growth spurt,
//                    menarche (components/steps/peds/Growth.js)
//   spine-history    the scoliosis and deformity history the shared steps do
//                    not ask (components/steps/peds/SpineHistory.js). For a new
//                    problem it follows the symptom details; at a follow-up it
//                    follows the shared interval step and at a post-operative
//                    visit the shared recovery step, showing only the sections
//                    that visit needs.
//   clinical-photos  right after the records: standing, forward-bend and side
//                    photographs (components/steps/peds/ClinicalPhotos.js)

/** Labels for the steps this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {
  growth: 'Growth & Development',
  'spine-history': 'Spine History',
  'clinical-photos': 'Clinical Photos',
};

/** Insert `id` right after `after` when `after` is in the list and `id` is not yet. */
function insertAfter(ids, after, id) {
  if (ids.includes(id)) return;
  const i = ids.indexOf(after);
  if (i >= 0) ids.splice(i + 1, 0, id);
}

/**
 * The step ids for a visit, from the base list for the visit type. The base
 * flows (lib/flows.js) put the interval step on a follow-up and the recovery
 * step on a post-operative visit; every other type carries symptom details.
 */
export function adjustSteps(ids, { type } = {}) {
  const out = [...ids];
  insertAfter(out, 'demographics', 'growth');
  if (type === 'followup') insertAfter(out, 'interval', 'spine-history');
  else if (type === 'postop') insertAfter(out, 'postop', 'spine-history');
  else insertAfter(out, 'symptom-details', 'spine-history');
  insertAfter(out, 'records', 'clinical-photos');
  return out;
}
