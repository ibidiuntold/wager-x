'use client';

import { Suspense } from 'react';
import SiteSettings from "@/components/admin/SiteSettings"; 
import { Skeleton } from "@/components/ui/skeleton"; 

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-[200px]">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Site Settings</h1>
        <p className="text-muted-foreground">Manage your site configuration, currencies, and FAQs</p>
      </div>
      
      <Suspense fallback={<LoadingState />}>
        <SiteSettings />
      </Suspense>
    </div>
  );
}
