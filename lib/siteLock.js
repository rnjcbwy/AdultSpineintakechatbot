// ============================================================================
// One codebase, one service per site.
//
// The same build serves more than one address. NEXT_PUBLIC_SERVICE_LOCK, set
// per Amplify app at build time, pins a site to one service:
//
//   intake.aaronweymd.com   adult_spine   (Amplify app d1i6bgjzjkpt0h)
//   ortho.aaronweymd.com    adult_ortho   (Amplify app d382smsgd5xkup)
//
// A locked site keeps the triage step for the kind of visit and any claim,
// offers only its own body areas, and sends a child or a problem that belongs
// to another service to that service's site. The pediatric forms run their
// own original apps at pedsspine.aaronweymd.com and pedsortho.aaronweymd.com.
// Unset (local development): every service, as the combined form was.
// ============================================================================

import { getService, isServiceKey } from './service';

export const LOCKED_SERVICE = isServiceKey(process.env.NEXT_PUBLIC_SERVICE_LOCK) ? process.env.NEXT_PUBLIC_SERVICE_LOCK : '';

/** Where each service's form lives. */
export const SITES = {
  adult_spine: 'https://intake.aaronweymd.com',
  adult_ortho: 'https://ortho.aaronweymd.com',
  peds_spine: 'https://pedsspine.aaronweymd.com',
  peds_ortho: 'https://pedsortho.aaronweymd.com',
};

export const lockedSpecialty = () => (LOCKED_SERVICE ? getService(LOCKED_SERVICE).specialty : '');

/** True when this site serves only one service and it is not `key`. */
export function belongsElsewhere(key) {
  return !!LOCKED_SERVICE && isServiceKey(key) && key !== LOCKED_SERVICE;
}

/** The other site's address for a service, keeping a query string (invite, lang). */
export function siteUrl(key, search = '', path = '/') {
  const base = SITES[key] || SITES.adult_spine;
  const qs = search && search !== '?' ? (search.startsWith('?') ? search : `?${search}`) : '';
  return `${base}${path}${qs}`;
}

/** The pediatric site for this site's specialty (spine or bones and joints). */
export const pedsSiteFor = (specialty) => (specialty === 'ortho' ? SITES.peds_ortho : SITES.peds_spine);
/** The adult site for the other specialty. */
export const otherAdultSite = (specialty) => (specialty === 'ortho' ? SITES.adult_spine : SITES.adult_ortho);
