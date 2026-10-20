'use client';

import { IntakeProvider } from '../../lib/store';
import ExpressIntake from '../../components/ExpressIntake';

export default function ExpressApp() {
  return (
    <IntakeProvider>
      <ExpressIntake />
    </IntakeProvider>
  );
}
