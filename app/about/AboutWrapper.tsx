'use client';

import dynamic from 'next/dynamic';

const AboutPage = dynamic(() => import('./AboutPage'), { ssr: false });

export default function AboutWrapper() {
  return <AboutPage />;
}
