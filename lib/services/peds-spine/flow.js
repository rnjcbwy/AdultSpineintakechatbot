// How the pediatric spine service shapes the flow (lib/flows.js).

/** Labels for the steps this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {};

/**
 * The step ids for a visit, from the base list for the visit type. Insert,
 * drop or reorder steps here; `data` holds the answers so far.
 */
export function adjustSteps(ids /* , { type, data } */) {
  return ids;
}
