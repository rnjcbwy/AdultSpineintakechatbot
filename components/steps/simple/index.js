// Step id -> component for the short adult spine form (lib/simple.js).
// Merged into the wizard's map; lib/services/spine/flow.js decides the order.
import SimpleBasics from './SimpleBasics';
import SimpleStory from './SimpleStory';
import SimpleQuestions from './SimpleQuestions';
import SimpleHealth from './SimpleHealth';

export const SIMPLE_STEP_COMPONENTS = {
  'simple-basics': SimpleBasics,
  'simple-story': SimpleStory,
  'simple-questions': SimpleQuestions,
  'simple-health': SimpleHealth,
};
