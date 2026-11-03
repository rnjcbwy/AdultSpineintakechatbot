'use client';

import { IntakeProvider } from '../../lib/store';
import ContinueWithCode from '../../components/ContinueWithCode';

export default function Continue() {
  return (
    <IntakeProvider>
      <ContinueWithCode />
    </IntakeProvider>
  );
}
