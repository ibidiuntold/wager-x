'use client';

import { collection, CollectionReference } from 'firebase/firestore';
import { useMemo } from 'react';
import { db } from './firebase';

interface Collections {
  balancesRef: (userId: string) => CollectionReference;
  gamesRef: CollectionReference;
  wagersRef: CollectionReference;
}

export function useCollections(): Collections {
  return useMemo(() => ({
    balancesRef: (userId: string) => collection(db, `users/${userId}/balances`),
    gamesRef: collection(db, 'games'),
    wagersRef: collection(db, 'wagers'),
  }), []);
}
