import './globals.css';
import { IS_PRODUCTION_TIER } from '../lib/deploymentTier';

export const metadata = {
  title: 'Before Your Visit',
  description: 'A calm, step-by-step way to put your whole history in one place before your visit.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Figtree:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream-100">
        {children}
        <footer className="py-6 text-center">
          <p className="text-xs text-gray-400">
            {IS_PRODUCTION_TIER
              ? 'Take your time. You can pause and come back whenever you like.'
              : '🚧 Prototype for demonstration purposes only — not a medical device and not HIPAA compliant. Do not enter real patient information.'}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">© 2026 Northfield Advisory Group, LLC</p>
        </footer>
      </body>
    </html>
  );
}
