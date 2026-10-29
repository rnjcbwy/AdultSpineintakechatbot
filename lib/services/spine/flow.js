// How this service shapes the flow (lib/flows.js). The adult spine flow is the
// base every other service starts from, so there is nothing to change here.

/** Labels for any step this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {
  'simple-basics': 'About you',
  'simple-story': 'What is bothering you',
  'simple-questions': 'A few questions',
  'simple-health': 'Your health',
};

/**
 * The step ids for a visit, from the base list for the visit type. A service
 * may insert, drop or reorder steps, and may look at the answers so far
 * (`data`) to shorten a flow, e.g. a fracture-clinic visit.
 */
export function adjustSteps(ids, { type, data } = {}) {
  // The short form (lib/simple.js): five screens, nothing else.
  if (data?.mode === 'simple') {
    return type === 'followup' || type === 'postop'
      ? ['welcome', 'simple-basics', 'simple-story', 'simple-questions', 'review']
      : ['welcome', 'simple-basics', 'simple-story', 'simple-questions', 'simple-health', 'review'];
  }
  return ids;
}
