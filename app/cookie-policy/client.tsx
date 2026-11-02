'use client';
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the page component with ssr: false
const CookiePolicyPage = dynamic(
  () => import('./page'),
  { ssr: false }
);

const CookiePolicyClient = () => {
  return <CookiePolicyPage />;
};

export default CookiePolicyClient;