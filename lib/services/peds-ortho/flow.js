// ============================================================================
// How the pediatric ortho service shapes the flow (lib/flows.js).
//
// Every child's visit gets the growth step after demographics and the
// clinical-photos step after the records upload. A new problem opens with
// one question, "Is this about a recent injury or a broken bone?", on the
// `injury` step; the answer is `pedsOrtho.track`:
//
//   'fracture'  the fracture clinic. The injury and the care so far are two
//               short screens (`injury`, `injury-care`) and the long history
//               is cut back the way the source app's short path cut it: no
//               chief complaint, body map, symptom details, prior treatments,
//               surgical history or questionnaires. Medications, allergies,
//               family history, the review of systems and the review remain.
//   'full'      the ordinary new-patient flow; the step was that one question.
//
// A follow-up gets `fx-followup` after the interval history; it opens with
// the same question and, for a fracture, asks the cast-check questions and
// drops the same long steps. A post-operative visit gets `fx-followup` after
// the shared post-op step, where it asks the child's wound, pain-medicine,
// restriction and activity questions the shared step does not.
// ============================================================================

/** Labels for the steps this service adds; merged over lib/flows.js STEP_LABELS. */
export const STEP_LABELS = {
  growth: 'Growth',
  injury: 'What Happened',
  'injury-care': 'Care So Far',
  'fx-followup': 'Recovery So Far',
  'clinical-photos': 'Photos',
};

/** Visit types that start with a new problem, where the injury question is asked. */
const NEW_PROBLEM_TYPES = new Set(['new', 'new_problem', 'workers_comp', 'personal_injury']);

/** The long-history steps the fracture clinic does without. */
const FRACTURE_DROPS = new Set(['chief-complaint', 'pain-map', 'symptom-details', 'treatments', 'psh', 'proms']);

const insertAfter = (ids, anchor, ...inserts) => {
  const i = ids.indexOf(anchor);
  if (i < 0) return ids;
  return [...ids.slice(0, i + 1), ...inserts, ...ids.slice(i + 1)];
};

/**
 * The step ids for a visit, from the base list for the visit type. `data`
 * holds the answers so far; `data.pedsOrtho.track` decides the track.
 */
export function adjustSteps(ids, { type, data } = {}) {
  let out = [...ids];
  const track = data?.pedsOrtho?.track || '';
  const fracture = track === 'fracture';

  out = insertAfter(out, 'demographics', 'growth');

  if (NEW_PROBLEM_TYPES.has(type || 'new')) {
    out = insertAfter(out, 'growth', 'injury');
    if (fracture) out = insertAfter(out, 'injury', 'injury-care');
  }
  if (type === 'followup') out = insertAfter(out, 'interval', 'fx-followup');
  if (type === 'postop') out = insertAfter(out, 'postop', 'fx-followup');

  if (fracture && type !== 'postop') out = out.filter((id) => !FRACTURE_DROPS.has(id));

  out = insertAfter(out, 'records', 'clinical-photos');
  return out;
}
