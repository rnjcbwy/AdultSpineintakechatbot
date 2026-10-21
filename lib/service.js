// ============================================================================
// The four services behind the one form.
//
// One site takes every patient. Two facts, learned on the first screen after
// the welcome (components/steps/Triage.js), decide which questions follow:
//
//   patient    'adult' | 'child'   — who the visit is for (a child is under 18)
//   specialty  'spine' | 'ortho'   — the neck and back, or a bone or joint
//
// Together they name a service, and the service names the content: the
// symptom regions, the problem groups, the body-map triggers, the
// questionnaires, the red flags, the interview prompts, the note spec and the
// extra steps the flow gets. Everything that differs between the four old
// intakes lives under lib/services/<service>/ and is reached through
// getService(); everything else (demographics, uploads, medications,
// allergies, review, kiosk mode, languages, Practice Hub) is shared and
// written once. The two pediatric folders start from the adult folder of the
// same specialty and override what a child's visit changes.
//
// The keys match Practice Hub's form keys, so an invite from a chart
// (`form: 'peds_ortho'`) sets the service outright.
// ============================================================================

import * as spine from './services/spine';
import * as ortho from './services/ortho';
import * as pedsSpine from './services/peds-spine';
import * as pedsOrtho from './services/peds-ortho';

export const PATIENTS = ['adult', 'child'];
export const SPECIALTIES = ['spine', 'ortho'];

export const SERVICES = {
  adult_spine: { key: 'adult_spine', patient: 'adult', specialty: 'spine', label: 'Adult spine', source: 'adult-spine-intake' },
  adult_ortho: { key: 'adult_ortho', patient: 'adult', specialty: 'ortho', label: 'Adult orthopaedics', source: 'adult-ortho-intake' },
  peds_spine: { key: 'peds_spine', patient: 'child', specialty: 'spine', label: 'Pediatric spine', source: 'peds-spine-intake' },
  peds_ortho: { key: 'peds_ortho', patient: 'child', specialty: 'ortho', label: 'Pediatric orthopaedics', source: 'peds-ortho-intake' },
};

export const DEFAULT_SERVICE = 'adult_spine';

/** The service key for a patient/specialty pair, or '' until both are known. */
export function serviceKeyFor({ patient, specialty } = {}) {
  if (!PATIENTS.includes(patient) || !SPECIALTIES.includes(specialty)) return '';
  return `${patient === 'child' ? 'peds' : 'adult'}_${specialty}`;
}

export function isServiceKey(key) {
  return Object.prototype.hasOwnProperty.call(SERVICES, key);
}

const MODULES = { adult_spine: spine, adult_ortho: ortho, peds_spine: pedsSpine, peds_ortho: pedsOrtho };

/**
 * Everything that depends on the service, under one object. Components read
 * it through useService() (lib/store.js); the server reads it from the
 * submitted data's `service.key`. Unknown or missing keys fall back to the
 * adult spine content so an old draft still opens.
 */
export function getService(key) {
  const meta = SERVICES[isServiceKey(key) ? key : DEFAULT_SERVICE];
  return { ...meta, ...MODULES[meta.key] };
}

/** Years old on a date, from an ISO date of birth; NaN when unknown. */
export function ageOn(dob, on = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  if (!m) return NaN;
  const birth = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  let years = on.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = on.getUTCMonth() < birth.getUTCMonth() || (on.getUTCMonth() === birth.getUTCMonth() && on.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

/** The body regions the triage step offers, and the specialty each implies. */
export const TRIAGE_REGIONS = [
  { id: 'neck', label: 'Neck', specialty: 'spine' },
  { id: 'back', label: 'Back', specialty: 'spine' },
  { id: 'posture', label: 'Posture or a curve in the spine', specialty: 'spine' },
  { id: 'shoulder', label: 'Shoulder', specialty: 'ortho' },
  { id: 'elbow', label: 'Elbow', specialty: 'ortho' },
  { id: 'hand', label: 'Hand, wrist or fingers', specialty: 'ortho' },
  { id: 'hip', label: 'Hip', specialty: 'ortho' },
  { id: 'knee', label: 'Knee', specialty: 'ortho' },
  { id: 'foot', label: 'Ankle or foot', specialty: 'ortho' },
  { id: 'other', label: 'Somewhere else / not sure', specialty: '' },
];

/**
 * The specialty the tapped regions settle on their own, without the model:
 * all spine, or all bone-and-joint. Mixed or unsure returns '' and the
 * description decides.
 */
export function specialtyFromRegions(regions = []) {
  const set = new Set(regions.map((id) => TRIAGE_REGIONS.find((r) => r.id === id)?.specialty).filter(Boolean));
  return set.size === 1 ? [...set][0] : '';
}
