// Step id -> component for the quick questionnaire (lib/simple.js).
// Merged into the wizard's map; lib/flows.js decides the order.
import SimpleBasics from './SimpleBasics';
import SimpleStory from './SimpleStory';
import SimpleQuestions from './SimpleQuestions';
import SimpleHealth from './SimpleHealth';
import SimpleRos from './SimpleRos';

export const SIMPLE_STEP_COMPONENTS = {
  'simple-basics': SimpleBasics,
  'simple-story': SimpleStory,
  'simple-questions': SimpleQuestions,
  'simple-health': SimpleHealth,
  'simple-ros': SimpleRos,
};
