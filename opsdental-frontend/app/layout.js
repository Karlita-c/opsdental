import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import BootstrapJS from '@/components/BootstrapJS';

export const metadata = {
  title: 'OpsDental',
  description: 'Plataforma de agendamiento de citas dentales',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <BootstrapJS />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

