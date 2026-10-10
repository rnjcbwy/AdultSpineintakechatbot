// ============================================================================
// Which kind of deployment this is.
//
//   prototype   demonstration only; fictional data; loud warnings everywhere
//   production  the AWS deployment under the BAA; real patients
//
// NEXT_PUBLIC_DEPLOYMENT_TIER is inlined at build time, so the same build is
// never half one and half the other. Server code reads DEPLOYMENT_TIER too.
// ============================================================================

export const DEPLOYMENT_TIER =
  process.env.NEXT_PUBLIC_DEPLOYMENT_TIER || process.env.DEPLOYMENT_TIER || 'prototype';

export const IS_PRODUCTION_TIER = DEPLOYMENT_TIER === 'production';

/**
 * The brand on every patient-facing page: the surgeon himself. This intake is
 * his, not a hospital's or a group's, so no institution or practice name
 * appears anywhere a patient reads. No personal email, ever.
 */
export const PRACTICE = {
  surgeon: 'Aaron Wey, MD, FAAOS, FACS',
  credential: 'Adult and Pediatric Spine Surgeon',
};
