// How this service shapes the flow (lib/flows.js). The adult spine flow is the
// base every other service starts from; the quick questionnaire's steps are
// in lib/flows.js and are the same for every adult service.

/** Labels for any step this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {};

/**
 * The step ids for a visit, from the base list for the visit type. A service
 * may insert, drop or reorder steps, and may look at the answers so far
 * (`data`) to shorten a flow, e.g. a fracture-clinic visit.
 */
export function adjustSteps(ids, { data } = {}) {
  if (data?.mode === 'simple') return ids;
  // The comprehensive form: the first step (triage) carries the main concern
  // and the areas, and family history is a question on the medical history step.
  return ids.filter((id) => id !== 'chief-complaint' && id !== 'family');
}
