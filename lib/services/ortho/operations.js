// ============================================================================
// A patient's bone and joint operations, as the intake records them.
//
// A post-operative visit is about the most recent operation, but a patient
// may have had several (a fracture fixation, then hardware removal; a knee
// scope, then a replacement). Each is kept as its own entry with as much of
// the date as the patient knows: the year always, the month usually, the
// exact day when it is known or when the office already has it on file. The
// postoperative interval is worked out here from the most recent one; the
// patient is never asked to calculate it.
//
// The `levels` field is kept by that name because Practice Hub stores it
// under that name for every intake; here it holds the SIDE (right, left,
// both), and `levelsOther` holds the bone or joint as the patient names it.
//
// Plain data and functions only (no React): used by the form, the note
// prompt, the transcript PDF and the Practice Hub hand-off alike.
// ============================================================================

export const OPERATION_KINDS = [
  'First operation',
  'Revision or re-do of an earlier operation',
  'Planned second stage of an earlier operation',
  'A separate, later operation',
];

export const OPERATION_WHERE = ['Here, with this surgeon', 'With another surgeon'];

/** One-tap entries for "Who did it, and where?"; each tap adds to the text. */
export const SURGEON_SHORTCUTS = ['Dr. Wey', 'Dr. Pfisterer', 'Holy Name Medical Center, Teaneck, NJ'];

/** True when the typed surgeon is one of this practice's surgeons. */
export const isThisPractice = (text) => /\b(wey|pfisterer)\b/i.test(String(text || ''));

/**
 * The internal where-flag, worked out from what the patient typed. The office
 * and Practice Hub still use it: an operation by this practice is matched to
 * the surgery booking rather than recorded twice.
 */
export const whereFor = (text) => (isThisPractice(text) ? OPERATION_WHERE[0] : String(text || '').trim() ? OPERATION_WHERE[1] : '');

export const PROCEDURE_OPTIONS = [
  'Total knee replacement',
  'Partial knee replacement',
  'Total hip replacement',
  'Shoulder replacement',
  'Knee arthroscopy (meniscus or cartilage)',
  'ACL reconstruction',
  'Rotator cuff repair',
  'Shoulder labral repair',
  'Fracture fixation (plate, screws, rod or pins)',
  'Hip nail for hip fracture',
  'Hip hemiarthroplasty for hip fracture',
  'Hardware removal',
  'Foreign body removal',
  'Carpal tunnel release',
  'Trigger finger release',
  'Tendon or ligament repair',
  'Achilles tendon repair',
  'Ankle ligament repair',
  'Elbow surgery',
];

/** Side chips. Stored in `levels` so the hand-off shape matches the other intakes. */
export const LEVEL_OPTIONS = ['Right', 'Left', 'Both sides', 'Not sure'];
export const SIDE_OPTIONS = LEVEL_OPTIONS;

/** The kinds of lumbar fusion: none here (a spine procedure). Kept so both services export the same names. */
export const LUMBAR_FUSION_TYPES = [];

/** Procedures that open a second row of choices (none in this intake). */
export const PROCEDURE_SUBOPTIONS = {};

/** How the post-operative step asks where the operation was. */
export const LEVEL_FIELDS = {
  label: 'Which side?',
  otherLabel: 'Which bone or joint?',
  otherPlaceholder: 'e.g., Knee, or wrist',
};

export const SITE_SUGGESTIONS = ['Shoulder', 'Elbow', 'Wrist', 'Hand or finger', 'Hip', 'Knee', 'Ankle', 'Foot or toe', 'Upper arm bone (humerus)', 'Thigh bone (femur)', 'Shin bone (tibia)', 'Collarbone', 'Forearm'];

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MONTH_INDEX = Object.fromEntries(MONTHS.map((m, i) => [m.toLowerCase(), i + 1]));

/**
 * 'March 2022' | '2022' | '' from a year and a 1-based month: the free-text
 * date the surgical-history step stores, built from the month/year picker.
 */
export function monthYearText(year, month) {
  if (!/^\d{4}$/.test(String(year || ''))) return '';
  const m = parseInt(month, 10);
  return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${year}` : String(year);
}

/**
 * The year and month ('1'..'12', or '') out of a date the patient typed or
 * the picker built: 'March 2022', 'Mar 2022', '03/2022', '2022-03', '2022'.
 * Anything else gives empty parts and the text is kept as it was typed.
 */
export function monthYearParts(text) {
  const s = String(text || '').trim();
  let m = /^(\d{4})(?:-(\d{1,2})(?:-\d{1,2})?)?$/.exec(s);
  if (m) return { year: m[1], month: m[2] ? String(parseInt(m[2], 10)) : '' };
  m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return { year: m[2], month: String(parseInt(m[1], 10)) };
  m = /^([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(s);
  if (m) {
    const name = m[1].toLowerCase();
    const idx = MONTH_INDEX[name] || MONTHS.findIndex((x) => x.toLowerCase().startsWith(name.slice(0, 3))) + 1;
    if (idx >= 1) return { year: m[2], month: String(idx) };
  }
  return { year: '', month: '' };
}

/**
 * The operation as one line: each tapped procedure (with any sub-types in
 * brackets), then whatever the patient typed. Everything downstream (the
 * note, the PDF, Practice Hub) reads this line.
 */
export function composeProcedure(list = [], subs = {}, other = '') {
  const parts = (list || []).map((l) => (subs?.[l]?.length ? `${l} (${subs[l].join(', ')})` : l));
  if (String(other || '').trim()) parts.push(String(other).trim());
  return parts.join('; ');
}

export function emptyOperation(kind = 'First operation') {
  return {
    id: `op_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    procedure: '',
    procedureList: [],   // the tapped procedures
    procedureSubs: {},   // { 'Lumbar fusion': ['TLIF'] }
    procedureOther: '',  // in the patient's own words
    levels: [],      // side: Right | Left | Both sides | Not sure
    levelsOther: '', // the bone or joint, as the patient names it
    year: '',
    month: '', // '1'..'12'
    day: '',   // '1'..'31', only when known
    kind,
    where: '',
    surgeon: '',
    // Set when the entry came from the patient's chart rather than being typed.
    onFile: false,
    chartId: null,
  };
}

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD' | '' — as much of the date as is known. */
export function operationDate(op) {
  if (!op || !/^\d{4}$/.test(String(op.year || ''))) return '';
  const y = String(op.year);
  const m = parseInt(op.month, 10);
  if (!(m >= 1 && m <= 12)) return y;
  const d = parseInt(op.day, 10);
  if (!(d >= 1 && d <= 31)) return `${y}-${pad(m)}`;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Split a stored 'YYYY[-MM[-DD]]' back into the entry's year/month/day. */
export function dateParts(date) {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(String(date || ''));
  if (!m) return { year: '', month: '', day: '' };
  return { year: m[1], month: m[2] ? String(parseInt(m[2], 10)) : '', day: m[3] ? String(parseInt(m[3], 10)) : '' };
}

/** A Date for the middle of whatever is known, for ordering and intervals. */
export function operationTime(op) {
  const d = operationDate(op);
  if (!d) return NaN;
  const [y, m, day] = d.split('-').map((x) => parseInt(x, 10));
  if (!m) return Date.UTC(y, 6, 1);
  if (!day) return Date.UTC(y, m - 1, 15);
  return Date.UTC(y, m - 1, day);
}

export function sortOperations(ops) {
  return [...(ops || [])].filter(Boolean).sort((a, b) => (operationTime(a) || 0) - (operationTime(b) || 0));
}

export function mostRecentOperation(ops) {
  const sorted = sortOperations(ops).filter((o) => !Number.isNaN(operationTime(o)));
  return sorted[sorted.length - 1] || (ops || [])[0] || null;
}

export function fmtOperationDate(op) {
  const d = operationDate(op);
  if (!d) return 'date not given';
  const [y, m, day] = d.split('-').map((x) => parseInt(x, 10));
  if (!m) return String(y);
  const name = MONTHS[m - 1];
  return day ? `${name} ${day}, ${y}` : `${name} ${y}`;
}

/** "right knee", "left shoulder", "both hips", "wrist" — side and site as one phrase. */
export function siteText(op) {
  const side = (op?.levels || []).filter((l) => l && l !== 'Not sure');
  const site = (op?.levelsOther || '').trim();
  const sideWord = side.includes('Both sides') ? 'both' : side.includes('Right') && side.includes('Left') ? 'both' : side[0] ? side[0].toLowerCase() : '';
  if (sideWord && site) return `${sideWord} ${site.toLowerCase()}`;
  if (site) return site.toLowerCase();
  if (sideWord) return `${sideWord} side`;
  return (op?.levels || []).includes('Not sure') ? 'side not known' : '';
}

/** Kept under the old name: the transcript PDF and the hand-off call it. */
export const levelsText = siteText;

/** "Total knee replacement, right knee (March 2025; first operation; here)" */
export function describeOperation(op) {
  if (!op) return '';
  const bits = [fmtOperationDate(op)];
  if (op.kind) bits.push(op.kind.toLowerCase());
  if (String(op.surgeon || '').trim()) bits.push(`with ${String(op.surgeon).trim()}`);
  else if (op.where === 'With another surgeon') bits.push('with another surgeon');
  else if (op.where) bits.push('with this surgeon');
  const site = siteText(op);
  return `${op.procedure || 'operation not named'}${site ? `, ${site}` : ''} (${bits.join('; ')})`;
}

/**
 * How long since an operation, from what is known of its date, in the units
 * a surgeon would use. Approximate when only the month or year is known.
 */
export function intervalSince(op, now = Date.now()) {
  const t = operationTime(op);
  if (Number.isNaN(t)) return '';
  const days = Math.round((now - t) / 86_400_000);
  if (days < 0) return '';
  const approx = operationDate(op).length < 10 ? 'about ' : '';
  if (days < 21) return `${approx}${days} days`;
  if (days < 120) return `${approx}${Math.round(days / 7)} weeks`;
  if (days < 730) return `${approx}${Math.round(days / 30.4)} months`;
  return `${approx}${(days / 365.25).toFixed(1).replace(/\.0$/, '')} years`;
}

/** The joint a procedure name or site implies: shoulder | elbow | hand | hip | knee | foot | spine. */
export function jointForOperation(op) {
  const text = `${op?.procedure || ''} ${op?.levelsOther || ''}`.toLowerCase();
  if (/spine|spinal|lumbar|cervical|fusion|discectomy|laminectomy/.test(text)) return 'spine';
  if (/shoulder|rotator|labr|clavicle|collarbone|humer/.test(text)) return 'shoulder';
  if (/elbow|olecranon|radial head|tennis/.test(text)) return 'elbow';
  if (/hand|wrist|finger|thumb|carpal|trigger|dupuytren|forearm|radius|scaphoid/.test(text)) return 'hand';
  if (/hip|femoral neck|femur|thigh/.test(text)) return 'hip';
  if (/knee|acl|meniscus|patella|tibia|shin/.test(text)) return 'knee';
  if (/ankle|foot|achilles|bunion|toe|heel|calcane/.test(text)) return 'foot';
  return '';
}

/** The symptom-region ids an operation's side and procedure imply. */
export function regionsForOperation(op) {
  const joint = jointForOperation(op);
  if (!joint) return [];
  if (joint === 'spine') return ['neck-back'];
  const side = (op?.levels || []);
  const sides = side.includes('Both sides') || (side.includes('Right') && side.includes('Left'))
    ? ['right', 'left']
    : side.includes('Left') ? ['left'] : ['right'];
  return sides.map((s) => `${s}-${joint}`);
}

/** The form's entries as the office stores them (one row per operation). */
export function operationsForHandoff(ops) {
  return (ops || [])
    .filter((o) => o && (o.procedure || operationDate(o)))
    .map((o) => ({
      chartId: o.chartId || null,
      procedure: o.procedure || '',
      levels: siteText(o),
      date: operationDate(o),
      kind: o.kind || '',
      // This practice's own operations go to the hub as "this practice", so
      // they match the surgery booking; anyone else goes as the patient typed it.
      surgeon: isThisPractice(o.surgeon) ? 'this practice' : String(o.surgeon || '').trim() || (o.where === 'With another surgeon' ? 'another surgeon' : 'this practice'),
    }));
}

/** Entries the chart already has, as the form's entries, marked as on file. */
export function operationsFromChart(rows) {
  return (rows || []).map((r) => {
    const stored = String(r.levels || '');
    const side = /^both\b/i.test(stored) ? ['Both sides'] : /^right\b/i.test(stored) ? ['Right'] : /^left\b/i.test(stored) ? ['Left'] : [];
    const site = stored.replace(/^(both|right|left)\s+/i, '').replace(/^side$/i, '');
    return {
      ...emptyOperation(r.kind || 'First operation'),
      chartId: r.id || null,
      onFile: true,
      procedure: r.procedure || '',
      procedureOther: r.procedure || '',
      levels: side,
      levelsOther: site,
      ...dateParts(r.date),
      where: r.surgeon && r.surgeon !== 'this practice' ? whereFor(r.surgeon) : 'Here, with this surgeon',
      surgeon: r.surgeon && r.surgeon !== 'this practice' ? r.surgeon : '',
    };
  });
}
