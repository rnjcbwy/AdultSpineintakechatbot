// ============================================================================
// The fracture form: a short intake for a child with a simple injury.
//
// A broken bone or a fresh injury does not need the full history. Opened at
// /fracture (pedsortho.aaronweymd.com redirects there), the form is the
// pediatric orthopaedic service on its fracture-clinic track from the first
// screen, with no triage step and about five short screens:
//
//   about your child -> what happened -> care so far -> health check -> sign
//   (a follow-up for the same injury: about your child -> recovery -> sign)
//
// Everything downstream (the note, the PDF, Practice Hub, the cast-care
// handouts) is the pediatric orthopaedic service's, so nothing else changes.
// ============================================================================

export const FRACTURE_MODE = 'fracture';

/** True on /fracture and /fracture/<lang>, the fracture form's addresses. */
export function isFracturePath(pathname) {
  return /^\/fracture(\/|$)/i.test(String(pathname || ''));
}

/** The answers a fracture form starts with (also after "Start a new form"). */
export function fractureStart(defaultVisit = {}) {
  return {
    mode: FRACTURE_MODE,
    service: { patient: 'child', specialty: 'ortho', key: 'peds_ortho', how: 'fracture' },
    triage: { who: 'My child (under 18)', firstTime: '', regions: ['fracture'], description: '', suggestion: null },
    pedsOrtho: { track: 'fracture' },
    visit: { ...defaultVisit, choice: 'new', workInjury: 'No', hadSurgery: '', type: 'new' },
  };
}
