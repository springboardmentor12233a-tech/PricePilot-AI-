import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'PricePilot AI — Enterprise Dynamic Pricing & Revenue Intelligence',
  description:
    'AI-powered dynamic pricing, multi-horizon demand forecasting, revenue optimization, and business analytics platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <AuthGuard>{children}</AuthGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
