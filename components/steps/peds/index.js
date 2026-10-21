// Step id -> component for the steps only a child's visit has. Merged into
// the wizard's map (components/IntakeWizard.js); the service's flow.js
// decides when each appears.
import Growth from './Growth';
import ClinicalPhotos from './ClinicalPhotos';
import SpineHistory from './SpineHistory';
import Injury from './Injury';
import InjuryCare from './InjuryCare';
import FractureFollowUp from './FractureFollowUp';

export const PEDS_STEP_COMPONENTS = {
  'growth': Growth,
  'clinical-photos': ClinicalPhotos,
  'spine-history': SpineHistory,
  'injury': Injury,
  'injury-care': InjuryCare,
  'fx-followup': FractureFollowUp,
};
