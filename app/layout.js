import './globals.css';
import DisclaimerBanner from '../components/DisclaimerBanner';

export const metadata = {
  title: 'Spine Surgery Intake | Patient History Form',
  description: 'Secure patient intake form for adult spine surgery clinic. Complete your medical history before your appointment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream-100">
        <DisclaimerBanner />
        {children}
        <footer className="py-6 text-center">
          <p className="text-xs text-gray-400">
            🚧 Prototype for demonstration purposes only — not a medical device and not HIPAA compliant. Do not enter real patient information.
          </p>
        </footer>
      </body>
    </html>
  );
}
