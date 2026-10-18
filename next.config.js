/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

// Attachments are uploaded straight from the browser to the submissions
// bucket with a presigned URL, so that origin must be allowed by the CSP.
const uploadOrigins = ['https://*.s3.us-east-1.amazonaws.com', 'https://*.s3.amazonaws.com'];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src \'self\' data: https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  `connect-src 'self' ${uploadOrigins.join(' ')}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
];

const nextConfig = {
  reactStrictMode: true,
  // No `env:` block. The old config inlined OPENAI_API_KEY into the client
  // bundle; secrets never belong there. Server code reads process.env directly.
  // The printed cards link to /es, /ko and so on: serve the form there, in
  // that language (lib/store.js reads the code from the path).
  async rewrites() {
    return [{ source: '/:lang(es|zh|pt|ru|pl|ar|he|ko|ja|hi|ne)', destination: '/' }];
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
