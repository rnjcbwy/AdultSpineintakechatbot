// ============================================================================
// Outbound email: through the practice's Google Workspace SMTP relay when
// SMTP_HOST, SMTP_USER and a password are set (Workspace is under Google's
// BAA; this is how Practice Hub sends too), otherwise through Amazon SES.
//
// Configured by EMAIL_FROM, the sender both paths use, such as
//   "Dr. Aaron Wey's office <no-reply@aaronweymd.com>"
// The relay password is read once from Secrets Manager (SMTP_PASSWORD_SECRET_ID,
// the same secret Practice Hub reads) with the runtime's IAM role; SMTP_PASSWORD
// in the environment is for local testing only. Unset EMAIL_FROM means email is
// not sent; the form then offers the link to copy or to open in the patient's
// own mail app instead. Two messages go out: the finish-later or welcome link
// (a link, nothing about the person), and the thank-you after submitting with
// the patient-education guides chosen for them (lib/server/education.js: guide
// titles and links, nothing they wrote), which the patient agreed to when they
// acknowledged the office may email them to coordinate their care.
// ============================================================================

export function emailConfigured() {
  return !!process.env.EMAIL_FROM;
}

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASSWORD || process.env.SMTP_PASSWORD_SECRET_ID));
}

let cachedPassword = null;
let cachedAt = 0;
async function smtpPassword() {
  if (process.env.SMTP_PASSWORD) return process.env.SMTP_PASSWORD;
  if (cachedPassword && Date.now() - cachedAt < 10 * 60 * 1000) return cachedPassword;
  const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
  const sm = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const res = await sm.send(new GetSecretValueCommand({ SecretId: process.env.SMTP_PASSWORD_SECRET_ID }));
  cachedPassword = res.SecretString;
  cachedAt = Date.now();
  return cachedPassword;
}

let transport = null;
async function smtp() {
  if (transport) return transport;
  const nodemailer = (await import('nodemailer')).default;
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    // Google app passwords are shown in groups of four; the spaces are not part of the password.
    auth: { user: process.env.SMTP_USER, pass: String(await smtpPassword() || '').replace(/\s+/g, '') },
    connectionTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return transport;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw Object.assign(new Error('Email sending is not set up (EMAIL_FROM).'), { name: 'ConfigError' });
  if (smtpConfigured()) {
    const info = await (await smtp()).sendMail({ from, to, subject, text, ...(html ? { html } : {}) });
    return { messageId: info?.messageId || '' };
  }
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
