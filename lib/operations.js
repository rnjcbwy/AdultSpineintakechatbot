// ============================================================================
// A patient's spine operations, as the intake records them.
//
// A post-operative visit is about the most recent operation, but a patient
// may have had several (a first fusion, then a revision, then an extension).
// Each is kept as its own entry with as much of the date as the patient knows:
// the year always, the month usually, the exact day when it is known or when
// the office already has it on file. The postoperative interval is worked out
// here from the most recent one; the patient is never asked to calculate it.
//
// Plain data and functions only (no React): used by the form, the note
// prompt, the transcript PDF and the Practice Hub hand-off alike.
// ============================================================================

export const OPERATION_KINDS = [
  'First operation',
  'Revision of an earlier operation',
  'Extension of an earlier fusion',
  'A separate, later operation',
];

export const OPERATION_WHERE = ['Here, with this surgeon', 'With another surgeon'];

export const PROCEDURE_OPTIONS = [
  'Lumbar discectomy',
  'Lumbar laminectomy / decompression',
  'Lumbar fusion',
  'Cervical fusion (ACDF)',
  'Cervical disc replacement',
  'Posterior cervical fusion',
  'Scoliosis / deformity correction',
  'Kyphoplasty',
  'Hardware removal',
];

export const LEVEL_OPTIONS = [
  'C2-3', 'C3-4', 'C4-5', 'C5-6', 'C6-7', 'C7-T1',
  'T1-2', 'T2-3', 'T3-4', 'T4-5', 'T5-6', 'T6-7', 'T7-8', 'T8-9', 'T9-10', 'T10-11', 'T11-12', 'T12-L1',
  'L1-2', 'L2-3', 'L3-4', 'L4-5', 'L5-S1',
  'Not sure',
];

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function emptyOperation(kind = 'First operation') {
  return {
    id: `op_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    procedure: '',
    levels: [],
    levelsOther: '',
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

export function levelsText(op) {
  const list = (op?.levels || []).filter((l) => l && l !== 'Not sure');
  const parts = [...list, op?.levelsOther].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return (op?.levels || []).includes('Not sure') ? 'levels not known' : '';
}

/** "Lumbar fusion at L4-5, L5-S1 (March 2025; first operation; here)" */
export function describeOperation(op) {
  if (!op) return '';
  const bits = [fmtOperationDate(op)];
  if (op.kind) bits.push(op.kind.toLowerCase());
  if (op.where === 'With another surgeon') bits.push(op.surgeon ? `with ${op.surgeon}` : 'with another surgeon');
  else if (op.where) bits.push('with this surgeon');
  const lv = levelsText(op);
  return `${op.procedure || 'operation not named'}${lv ? ` at ${lv}` : ''} (${bits.join('; ')})`;
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

const REGION_OF_LEVEL = (lv) => (/^C/.test(lv) ? 'neck' : /^T/.test(lv) && !/^T12-L1$/.test(lv) ? 'upper-back' : /^(T12|L|S)/.test(lv) ? 'low-back' : '');

/** The symptom-region ids an operation's levels (or procedure name) imply. */
export function regionsForOperation(op) {
  const out = new Set();
  for (const lv of op?.levels || []) { const r = REGION_OF_LEVEL(lv); if (r) out.add(r); }
  if (!out.size) {
    const p = (op?.procedure || '').toLowerCase();
    if (/cervical|neck|acdf/.test(p)) out.add('neck');
    if (/lumbar|low back|l\d/.test(p)) out.add('low-back');
    if (/thoracic|scoliosis|deformity|kyphoplasty/.test(p)) out.add('upper-back');
  }
  return [...out];
}

/** The form's entries as the office stores them (one row per operation). */
export function operationsForHandoff(ops) {
  return (ops || [])
    .filter((o) => o && (o.procedure || operationDate(o)))
    .map((o) => ({
      chartId: o.chartId || null,
      procedure: o.procedure || '',
      levels: levelsText(o),
      date: operationDate(o),
      kind: o.kind || '',
      surgeon: o.where === 'With another surgeon' ? (o.surgeon || 'another surgeon') : 'this practice',
    }));
}

/** Entries the chart already has, as the form's entries, marked as on file. */
export function operationsFromChart(rows) {
  return (rows || []).map((r) => ({
    ...emptyOperation(r.kind || 'First operation'),
    chartId: r.id || null,
    onFile: true,
    procedure: r.procedure || '',
    levels: [],
    levelsOther: r.levels || '',
    ...dateParts(r.date),
    where: r.surgeon && r.surgeon !== 'this practice' ? 'With another surgeon' : 'Here, with this surgeon',
    surgeon: r.surgeon && r.surgeon !== 'this practice' ? r.surgeon : '',
  }));
}
