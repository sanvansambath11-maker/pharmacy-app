import './globals.css';
import { ThemeProvider } from 'next-themes';

export const metadata = {
  title: 'Batto Pharmacy - Your Trusted Healthcare Partner',
  description: 'Quality medicines, expert pharmacist support, and fast delivery to your doorstep.',
  manifest: '/manifest.json',
  themeColor: '#0d9488',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Batto Pharmacy',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
