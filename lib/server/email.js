// ============================================================================
// Outbound email through Amazon SES (HIPAA-eligible, under the account's BAA).
//
// Configured by EMAIL_FROM, a verified SES identity such as
//   "Dr. Aaron Wey's office <office@example.com>"
// Unset means email is not sent; the form then offers the link to copy or to
// open in the patient's own mail app instead. Two messages go out: the
// finish-later link (a link, nothing about the person), and the thank-you
// after submitting with the patient-education guides chosen for them
// (lib/server/education.js: guide titles and links, nothing they wrote),
// which the patient agreed to when they acknowledged the office may email
// them to coordinate their care.
// ============================================================================

export function emailConfigured() {
  return !!process.env.EMAIL_FROM;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw Object.assign(new Error('Email sending is not set up (EMAIL_FROM).'), { name: 'ConfigError' });
  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
  const client = new SESv2Client({ region: process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1' });
  const res = await client.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' }, ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}) } } },
  }));
  return { messageId: res.MessageId || '' };
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
