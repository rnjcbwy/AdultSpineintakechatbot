// ============================================================================
// Outbound email through Amazon SES (HIPAA-eligible, under the account's BAA).
//
// Configured by EMAIL_FROM, a verified SES identity such as
//   "Dr. Aaron Wey's office <office@example.com>"
// Unset means email is not sent; the form then offers the link to copy or to
// open in the patient's own mail app instead. The messages this app sends
// carry no health information: a link, and nothing about the person.
// ============================================================================

export function emailConfigured() {
  return !!process.env.EMAIL_FROM;
}

export async function sendEmail({ to, subject, text }) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw Object.assign(new Error('Email sending is not set up (EMAIL_FROM).'), { name: 'ConfigError' });
  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
  const client = new SESv2Client({ region: process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1' });
  const res = await client.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text } } } },
  }));
  return { messageId: res.MessageId || '' };
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
