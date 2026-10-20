import ExpressApp from './ExpressApp';

export const metadata = {
  title: 'Request an appointment',
  description: "A short chat with Dr. Aaron Wey's office: six questions, then the office contacts you within 24 to 48 hours to schedule.",
};

/**
 * /express — the short appointment request from the website chat launcher
 * (components/ExpressIntake.js). It shares the intake store with the full
 * form at /, so a patient who continues keeps everything they said.
 */
export default function ExpressPage() {
  return <ExpressApp />;
}
