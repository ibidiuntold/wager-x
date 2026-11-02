'use client';

import React, { useEffect, useState } from 'react';

interface Wager {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  totalPool: number;
  category: string;
  expiresAt: { toDate: () => Date };
  options: Array<{ name: string; odds: number }>;
}

export default function WagerPage({ wagerId }) {
  // Remove: const firestore = useFirestore();
  const [wager, setWager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWager = async () => {
      try {
        const res = await fetch(`/api/wagers?id=${wagerId}`);
        if (res.ok) {
          const data = await res.json();
          setWager(data.wager || null);
        } else {
          setError('Failed to fetch wager');
        }
      } catch (err) {
        setError('Failed to fetch wager');
      } finally {
        setLoading(false);
      }
    };
    if (wagerId) fetchWager();
  }, [wagerId]);

  if (loading) return <div>Loading wager...</div>;
  if (error) return <div>{error}</div>;
  if (!wager) return <div>No wager found.</div>;

  return (
    <div>
      <h1>{wager.title}</h1>
      {/* Render more wager details here */}
    </div>
  );
}
