// ============================================================================
// A child's bone and joint operations. The date handling, the interval, the
// hand-off shape and the chart import are the adult ortho module's; what
// changes is the menu of procedures and the sites, in the words a family
// uses (ported from the source app's OPERATION_SITE_CHIPS and the pediatric
// surgical history list).
// ============================================================================

export * from '../ortho/operations';

export const PROCEDURE_OPTIONS = [
  'Pins (wires) for a broken bone',
  'Plate and screws for a broken bone',
  'Flexible rods (nails) for a broken bone',
  'The bone was set under anaesthetic (closed reduction)',
  'Casting under anaesthetic',
  'Removal of pins, plate or screws',
  'SCFE pinning (slipped hip)',
  'Hip dysplasia surgery or osteotomy',
  'Guided growth plates (8-plate)',
  'Limb lengthening',
  'Knee arthroscopy',
  'ACL reconstruction',
  'Meniscus surgery',
  'Kneecap stabilisation (MPFL)',
  'Clubfoot surgery or Achilles tenotomy',
  'Heel cord lengthening',
  'Flatfoot reconstruction',
  'Tendon lengthening or transfer',
  'Extra digit removal (polydactyly)',
  'Bone biopsy or tumour surgery',
  'Joint washout for infection',
  'Elbow surgery',
  'Shoulder surgery',
];

export const SITE_SUGGESTIONS = [
  'Hip', 'Knee', 'Ankle', 'Foot', 'Thigh (femur)', 'Shin (tibia)',
  'Shoulder', 'Upper arm', 'Elbow', 'Forearm', 'Wrist', 'Hand or fingers',
  'Collarbone',
];

/** How the post-operative step asks where a child's operation was. */
export const LEVEL_FIELDS = {
  label: 'Which side?',
  otherLabel: 'Where on the body?',
  otherPlaceholder: 'e.g., Forearm, or hip',
};
