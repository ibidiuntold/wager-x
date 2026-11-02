'use client';

import { usePathname } from 'next/navigation';
import { memo, Suspense } from 'react';
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/contexts/ToastContext";
import { useToast } from "@/contexts/ToastContext";
import { Toast, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { AdminAuthWrapper } from "@/components/admin/AdminAuthWrapper";
import RoleGuard from "@/components/auth/RoleGuard";
import Preloader from "@/components/common/Preloader";
import { useAuth } from '@/hooks/useAuth';

// ✅ Memoized Toaster to avoid rerenders on unrelated updates
const Toaster = memo(function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} variant={variant} open={open}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </>
  );
});

// ✅ Simple loading fallback
const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading } = useAuth();

  const isLoginPage = pathname?.startsWith('/admin/login');

  const content = isLoginPage ? (
    children
  ) : (
    <RoleGuard allowedRoles={['admin']} redirectTo="/admin/login">
      <AdminNav>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </AdminNav>
    </RoleGuard>
  );

  return (
    <div className="min-h-screen bg-background">
      <ToastProvider>
        <Preloader isLoading={isLoading} layoutType="dashboard" />
        <AdminAuthWrapper>
          {content}
        </AdminAuthWrapper>
        <Toaster />
      </ToastProvider>
    </div>
  );
}
