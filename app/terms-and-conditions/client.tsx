// pages/terms-and-conditions/client.js

'use client';

import dynamic from 'next/dynamic';

const GenericPage = dynamic(
  () => import('@/components/page'),
  { ssr: false }
);

const TermsAndConditionsClient = () => {
  return <GenericPage pageKey="termsOfUsage" />;
};

export default TermsAndConditionsClient;