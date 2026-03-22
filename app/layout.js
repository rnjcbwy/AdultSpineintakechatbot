import './globals.css';

export const metadata = {
  title: 'Spine Surgery Intake | Patient History Form',
  description: 'Secure patient intake form for adult spine surgery clinic. Complete your medical history before your appointment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream-100">
        {children}
      </body>
    </html>
  );
}
