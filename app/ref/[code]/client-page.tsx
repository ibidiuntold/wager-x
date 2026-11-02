'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface ClientRefPageProps {
  code: string;
}

export default function ReferralClientPage({ code }) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApplyReferral = async () => {
    if (!user) {
      setError('You must be logged in to apply a referral code.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user.id }),
      });
      if (res.ok) {
        setSuccess('Referral code applied successfully!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to apply referral code.');
      }
    } catch (err) {
      setError('Failed to apply referral code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      handleApplyReferral();
    }
  }, [code]);

  return (
    <div>
      <h2>Referral</h2>
      {loading && <div>Applying referral code...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </div>
  );
}