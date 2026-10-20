// ============================================================================
// Which ad or link brought the patient here.
//
// Ads and the landing page at aaronweymd.com/get-started/ link to the form with
// standard campaign tags (utm_source=meta&utm_campaign=spine-2026q4 ...). The
// tags are read once, on the first visit, kept with the answers through
// finish-later, and stored with the submission, so the office can count
// completed intakes per campaign on its own systems.
//
// Nothing here goes back to an ad platform. That is the point: the form
// collects health information, so no pixel, tag or click identifier may tie a
// patient to an ad account. Click identifiers the platforms append (fbclid,
// gclid ...) are removed from the address bar and never stored.
//
// Values are short slugs chosen by the practice, never free text, so they are
// safe to log as codes (lib/server/log.js).
// ============================================================================

export const CAMPAIGN_KEYS = ['source', 'medium', 'campaign', 'content', 'term'];

// Identifiers ad platforms add to the click. Dropped, never kept.
const CLICK_IDS = ['fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'ttclid', 'twclid', 'li_fat_id', 'igshid', 'dclid', '_gl'];

const MAX_LEN = 60;

/** A tag value reduced to a slug: letters, digits, dot, dash, underscore. */
export function cleanTag(value) {
  if (value == null) return '';
  return String(value)
    .trim()
    .replace(/[\s+]+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, MAX_LEN);
}

/**
 * The campaign tags in a query string, or null when there are none.
 * `search` is window.location.search or a URLSearchParams.
 */
export function readCampaign(search, now = new Date()) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
  const out = {};
  for (const k of CAMPAIGN_KEYS) {
    const v = cleanTag(params.get(`utm_${k}`));
    if (v) out[k] = v;
  }
  if (!out.source && !out.campaign) return null;
  out.firstSeenAt = now.toISOString();
  return out;
}

/**
 * The stored form of a campaign object that came from the browser: known keys
 * only, every value re-cleaned. Anything else is discarded. Returns null when
 * nothing usable is left.
 */
export function cleanCampaign(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const out = {};
  for (const k of CAMPAIGN_KEYS) {
    const v = cleanTag(obj[k]);
    if (v) out[k] = v;
  }
  if (!out.source && !out.campaign) return null;
  const seen = typeof obj.firstSeenAt === 'string' && !Number.isNaN(Date.parse(obj.firstSeenAt)) ? new Date(obj.firstSeenAt).toISOString() : null;
  if (seen) out.firstSeenAt = seen;
  return out;
}

/**
 * The same query string without campaign tags or click identifiers, so they
 * are not bookmarked or shared onward. Other parameters (invite, lang,
 * resume, kiosk) are kept as they were. Returns '' or '?...'.
 */
export function stripCampaignParams(search) {
  const params = new URLSearchParams(search || '');
  let changed = false;
  for (const key of [...params.keys()]) {
    if (key.startsWith('utm_') || CLICK_IDS.includes(key)) { params.delete(key); changed = true; }
  }
  if (!changed) return null;
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}
