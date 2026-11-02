import { Suspense } from 'react';
import ClientRefPage from './client-page';
import type { Metadata } from 'next';

interface PageProps {
  params: {
    code: string;
  };
}

export default function RefPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <ClientRefPage code={params.code} />
    </Suspense>
  );
}

// This function generates metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  return {
    title: 'Join WagerX with a Friend',
    description: 'Sign up through a friend\'s referral and start playing exciting games on WagerX!',
    openGraph: {
      title: 'Join WagerX with a Friend',
      description: 'Sign up through a friend\'s referral and start playing exciting games on WagerX!',
      images: [
        {
          url: 'https://wagerx.ng/wager-invite.jpg',
          width: 1200,
          height: 630,
          alt: 'WagerX Invitation'
        }
      ]
    },
  };
}