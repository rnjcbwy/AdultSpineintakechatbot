// How this service shapes the flow (lib/flows.js). The adult spine flow is the
// base every other service starts from, so there is nothing to change here.

/** Labels for any step this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {};

/**
 * The step ids for a visit, from the base list for the visit type. A service
 * may insert, drop or reorder steps, and may look at the answers so far
 * (`data`) to shorten a flow, e.g. a fracture-clinic visit.
 */
export function adjustSteps(ids /* , { type, data } */) {
  return ids;
}
