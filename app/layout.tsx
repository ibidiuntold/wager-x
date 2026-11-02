import { Suspense } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PushNotificationPrompt } from '@/components/notification/PushNotificationPrompt';
import CookieConsentDialog from '@/components/common/CookieConsentDialog';
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/toast";
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import AnimatedTitle from '@/components/common/AnimatedTitle';
import { ReactQueryProvider } from '@/lib/queryClient';
import './globals.css';
import { Providers } from './Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://wagerx.ng'),
  title: 'WagerX - Wager Up! Wager Win!',
  description: 'Experience thrilling bets and massive wins with WagerX, the premier online betting platform.',
  openGraph: {
    title: 'WagerX - Wager Up! Wager Win!',
    description: 'Experience thrilling bets and massive wins with WagerX, the premier online betting platform.',
    images: ['/images/og-image.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WagerX - Wager Up! Wager Win!',
    description: 'Experience thrilling bets and massive wins with WagerX, the premier online betting platform.',
    images: ['/images/og-image.jpg']
  },
  icons: {
    icon: '/favicon.ico'
  }
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ReactQueryProvider>
            <ToastProvider>
              <ThemeProvider>
                <AnimatedTitle />
                <Suspense fallback={<LoadingSpinner />}>
                  <NotificationProvider>
                    {children}
                    <PushNotificationPrompt />
                  </NotificationProvider>
                </Suspense>
                <CookieConsentDialog />
              </ThemeProvider>
              <Toaster />
            </ToastProvider>
          </ReactQueryProvider>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}