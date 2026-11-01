import { PRACTICE } from '../../lib/deploymentTier';

export const metadata = {
  title: 'Text messaging terms',
  description: "How Dr. Aaron Wey's office uses text messages, and how to stop them.",
};

/** The office's texting number (Practice Hub answering service, Twilio). */
const TEXT_NUMBER = '(201) 801-4447';

/**
 * /texting-terms: the terms the phone carriers review for the office's
 * texting program (A2P 10DLC). Linked from the optional text-message box on
 * the appointment request form (lib/consent.js SMS_CONSENT). Kept here rather
 * than on aaronweymd.com at Dr. Wey's request (2026-11-01).
 */
export default function TextingTermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="card space-y-4 text-gray-800 leading-relaxed">
        <h1 className="text-2xl font-semibold text-gray-900">Text messaging terms</h1>
        <p>
          Dr. Aaron Wey&apos;s office sends text messages from {TEXT_NUMBER} only to patients, and to parents or guardians of
          patients, who agree to receive them. You can agree by checking the optional text-message box on the appointment
          request form on this site, by asking the office in person or by phone, or by texting the office first.
        </p>
        <p>
          Messages are about your care: replies to your questions, appointment scheduling and reminders, links to forms, and
          instructions before and after treatment. We do not send marketing or promotional messages. Message frequency varies
          with your care. Message and data rates may apply.
        </p>
        <p>
          Reply <strong>STOP</strong> at any time to stop receiving text messages, or reply <strong>HELP</strong> for help. You
          can also call the office at {PRACTICE.officePhone}. Agreeing to receive text messages is not a condition of treatment.
        </p>
        <h2 className="text-lg font-semibold text-gray-900 pt-2">Privacy</h2>
        <p>
          We do not sell, rent or share your mobile phone number or your text-messaging consent with third parties or
          affiliates for marketing or promotional purposes. Text-messaging opt-in data and consent are not shared with any third
          party, except the service providers that deliver the messages for the office.
        </p>
        <p>Mobile carriers are not liable for delayed or undelivered messages.</p>
      </div>
    </main>
  );
}
