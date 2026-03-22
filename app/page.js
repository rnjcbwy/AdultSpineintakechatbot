'use client';

import { IntakeProvider } from '../lib/store';
import IntakeWizard from '../components/IntakeWizard';

export default function Home() {
  return (
    <IntakeProvider>
      <IntakeWizard />
    </IntakeProvider>
  );
}
