// ============================================================================
// What the patient typed, condensed for the phone assistant.
//
// After submitting, a patient may call to tell Dr. Wey more in their own words
// (Practice Hub, server/intake-journeys.ts). The assistant reads this briefing
// so it asks only what the form left blank or vague. It is the patient's own
// answers, never anything from the chart; contact details, insurance,
// signatures, images and files are left out.
// ============================================================================

const SECTIONS = [
  ['visit', 'Kind of visit'],
  ['chiefComplaint', 'Main problem'],
  ['painMap', 'Body diagram'],
  ['hpiData', 'Symptom details'],
  ['pastMedicalHistory', 'Medical history'],
  ['pastSurgicalHistory', 'Surgical history'],
  ['medications', 'Medications'],
  ['allergies', 'Allergies'],
  ['socialHistory', 'Social history'],
  ['familyHistory', 'Family history'],
];

/** Keys that hold drawings, files, internals or the chat itself (added separately). */
const SKIP = /^(image|images|signature|svg|path|paths|points|coords|geometry|figure|documents?|uploads?|files?|id|version|timestamp)$|(Image|Images|Svg|Signature|Points|Coords|Id|At)$|^(conversationHistory|chatComplete|structuredComplete|detailMode)$/;

function prune(v, depth = 0) {
  if (v === null || v === undefined || v === false || v === '') return undefined;
  if (typeof v === 'string') return v.startsWith('data:') ? undefined : v.trim().slice(0, 600) || undefined;
  if (typeof v === 'number' || v === true) return v;
  if (depth > 5) return undefined;
  if (Array.isArray(v)) {
    const out = v.slice(0, 30).map((x) => prune(x, depth + 1)).filter((x) => x !== undefined);
    return out.length ? out : undefined;
  }
  if (typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      if (SKIP.test(k)) continue;
      const p = prune(x, depth + 1);
      if (p !== undefined) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

export function journeyBriefing(intake) {
  const parts = [];
  for (const [key, label] of SECTIONS) {
    const p = prune(intake?.[key]);
    if (p !== undefined) parts.push(`${label}: ${JSON.stringify(p)}`);
  }
  const words = (intake?.hpiData?.conversationHistory || [])
    .filter((m) => m?.role === 'user' && typeof m.content === 'string' && m.content.trim())
    .map((m) => `- ${m.content.trim().slice(0, 800)}`);
  if (words.length) parts.push(`In their own words (the form's guided interview):\n${words.join('\n')}`);
  const flags = (intake?.redFlags || []).map((f) => f?.label).filter(Boolean);
  if (flags.length) parts.push(`Warning signs they reported: ${flags.join('; ')}`);
  return parts.join('\n').slice(0, 16_000);
}
