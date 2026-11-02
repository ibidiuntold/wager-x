'use client';

import Image from 'next/image';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function MaintenanceContent() {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/images/logo/Logo.svg"
            alt={settings.appName}
            width={180}
            height={60}
            priority={true}
          /> 
        </div>

        {/* Maintenance Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary">Under Maintenance</h1>
          <p className="text-xl text-muted-foreground">
            We&apos;re currently performing scheduled maintenance to improve your experience.
            Please check back soon.
          </p>
        </div>

        {/* Estimated Time */}
        <div className="mt-8 text-sm text-muted-foreground">
          Thank you for your patience.
        </div>
      </div>
    </div>
  );
}
