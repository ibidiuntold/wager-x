'use client';

import dynamic from 'next/dynamic';

const BonusPolicyPage = dynamic(
  () => import('./page'),
  { ssr: false }
);

export default function BonusPolicyClient() {
  return <BonusPolicyPage />;
}