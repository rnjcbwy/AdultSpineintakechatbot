// How this service shapes the flow (lib/flows.js). The adult ortho flow is the
// same as the adult spine flow; the content differs, not the steps.

/** Labels for any step this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {};

/** The step ids for a visit, from the base list for the visit type. */
export function adjustSteps(ids /* , { type, data } */) {
  return ids;
}
