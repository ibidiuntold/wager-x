import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export const useReferral = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
  });

  const getUserReferralCode = useCallback(async () => {
    if (!user?.id) return null;
    const res = await fetch(`/api/users?id=${user.id}`);
    const result = await res.json();
    if (!res.ok) return null;
    return result.user?.referralCode || null;
  }, [user?.id]);

  const createReferral = async (referralCode: string) => {
    if (!user?.id) return null;
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrerId: user.id, referralCode, status: 'pending' }),
    });
    const result = await res.json();
    if (!res.ok) return null;
    return result.referralId;
  };

  const completeReferral = async (referralCode: string, referredId: string) => {
    const res = await fetch('/api/referrals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode, referredId, status: 'completed' }),
    });
    const result = await res.json();
    return res.ok;
  };

  // Add other referral operations as needed, using /api/referrals

  return {
    getUserReferralCode,
    createReferral,
    completeReferral,
    referralStats,
  };
};