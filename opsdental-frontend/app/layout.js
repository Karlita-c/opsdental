import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import BootstrapJS from '@/components/BootstrapJS';
import PWARegister from '@/components/PWARegister';

export const metadata = {
  title: 'OpsDental',
  description: 'Plataforma de agendamiento de citas dentales',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OpsDental',
  },
};

export const viewport = {
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpsDental" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <BootstrapJS />
            <PWARegister />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

