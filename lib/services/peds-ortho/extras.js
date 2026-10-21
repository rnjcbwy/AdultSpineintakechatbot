// ============================================================================
// What the pediatric orthopaedic steps add to the shared pages: sections for
// the transcript PDF and items for the review page, built from everything
// under `pedsOrtho` (track, injury, injuryCare, fxFollowUp, postop). The
// labels are the words the parent was shown. Plain data, no React.
// ============================================================================

const text = (v) => (v === null || v === undefined ? '' : String(v).trim());
const list = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : text(v));
const where = (parts, side) => [side && side !== 'Not sure' ? side : '', list(parts)].filter(Boolean).join(' ');

/** [label, value] rows, dropping the empty ones. */
const rows = (pairs) => pairs.map(([label, v]) => [label, typeof v === 'string' ? v : list(v)]).filter(([, v]) => v);

/** The row groups, one per pediatric section the family answered. */
function sections(intake) {
  const po = intake?.pedsOrtho || {};
  const out = [];
  const inj = po.injury || {};
  const care = po.injuryCare || {};
  const fx = po.fxFollowUp || {};
  const post = po.postop || {};

  if (po.track === 'fracture' && Object.keys(inj).length) {
    out.push({
      id: 'injury',
      step: 'injury',
      title: 'The injury',
      rows: rows([
        ['Kind of visit', 'Fracture clinic: a recent injury or broken bone'],
        ['What is hurt', where(inj.bodyPart, inj.side)],
        ['When it happened', inj.injuryDate],
        ['Hand dominance', inj.handDominance],
        ['How it happened', inj.mechanismChips],
        ['In their own words', inj.mechanism],
        ['Could use it or bear weight afterwards', inj.useAfter],
        ['Pop or crack', inj.popCrack],
        ['Noticed at the time', inj.signs],
        ['Pain now (0-10)', inj.painNow],
      ]),
    });
  }

  if (po.track === 'fracture' && Object.keys(care).length) {
    out.push({
      id: 'injuryCare',
      step: 'injury-care',
      title: 'Care so far',
      rows: rows([
        ['Seen at', care.seenWhere],
        ['Which hospital, office or doctor', care.seenWhereName],
        ['Imaging', care.imagingDone],
        ['Imaging where', care.imagingWhere],
        ['Told the imaging showed', care.imagingTold],
        ['Treatment', care.treatment],
        ['Applied or done when', care.treatmentWhen],
        ['Still on', care.stillOn],
        ['Surgery or reduction, as described', care.surgeryDetail],
        ['Pain medicine', care.painMeds],
        ['Previous broken bones', care.priorFractures],
        ['Hoping to get back to', care.returnGoal],
      ]),
    });
  }

  if (po.track === 'fracture' && Object.keys(fx).length) {
    out.push({
      id: 'fxFollowUp',
      step: 'fx-followup',
      title: 'Since the injury',
      rows: rows([
        ['Kind of visit', 'Fracture follow-up'],
        ['What is hurt', where(fx.bodyPart, fx.side)],
        ['When it was broken or injured', fx.injuryDate],
        ['Treatment', fx.treatment],
        ['Cast, splint or brace still on', fx.stillOn],
        ['Cast or splint problems', fx.castProblems],
        ['Pain now (0-10)', fx.painNow],
        ['Compared with the last visit', fx.painTrend],
        ['Using the limb', fx.usingLimb],
        ['Imaging since the last visit', fx.imagingSince],
        ['Warning symptoms', fx.warnings],
        ['Re-injured', fx.reinjury],
        ['What happened', fx.reinjuryDetail],
        ['Pain medicine since', fx.medsSince],
        ['Hoping to get back to', fx.returnGoal],
      ]),
    });
  }

  if (Object.keys(post).length) {
    out.push({
      id: 'postop',
      step: 'fx-followup',
      title: 'Since the operation',
      rows: rows([
        ['Recovery', post.recoveryTrend],
        ['The wound', post.wound],
        ['Dressing', post.dressing],
        ['Compared with a few days ago', post.painTrend],
        ['Pain medicine', post.painMeds],
        ['Which medicine, how often', post.painMedsDetail],
        ['Physical therapy', post.therapy],
        ['Therapy where and how often', post.therapyWhere],
        ['Restrictions', post.restrictions],
        ['Able to stick to them', post.followingRestrictions],
        ['Since the operation', post.events],
        ['In their own words', post.eventDetail],
        ['School and activities', post.activityStatus],
        ['Hoping to get back to', post.returnGoal],
      ]),
    });
  }

  return out.filter((s) => s.rows.length);
}

/** [{ title, rows: [[label, value], ...] }] for the transcript PDF, after the shared sections. */
export function pdfSections(intake) {
  return sections(intake).map(({ title, rows: r }) => ({ title, rows: r }));
}

/** The rows worth a line on the review page, per section. */
const REVIEW_PICK = {
  injury: ['Kind of visit', 'What is hurt', 'When it happened', 'How it happened', 'Could use it or bear weight afterwards', 'Noticed at the time', 'Pain now (0-10)'],
  injuryCare: ['Seen at', 'Imaging', 'Treatment', 'Still on', 'Hoping to get back to'],
  fxFollowUp: ['Kind of visit', 'What is hurt', 'Treatment', 'Cast, splint or brace still on', 'Cast or splint problems', 'Warning symptoms', 'Pain now (0-10)', 'Using the limb'],
  postop: ['Recovery', 'The wound', 'Pain medicine', 'Restrictions', 'Able to stick to them', 'Since the operation'],
};

/** [{ label, value, step }] for the review page's summary, after the shared items. */
export function reviewItems(intake, t = (s) => s) {
  const out = [];
  for (const s of sections(intake)) {
    const pick = REVIEW_PICK[s.id] || [];
    for (const [label, value] of s.rows) {
      if (!pick.includes(label)) continue;
      // Chip values are English option strings; each goes through t on its own.
      const shown = value.includes(', ') ? value.split(', ').map((v) => t(v)).join(', ') : t(value);
      out.push({ label: t(label), value: shown, step: s.step });
    }
  }
  return out;
}
