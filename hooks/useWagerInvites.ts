'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  orderBy,
  DocumentData
} from 'firebase/firestore';
import type { Wager } from '@/types/game.types';

export interface WagerInvitation {
  id: string;
  wagerId: string;
  wagerTitle?: string;
  wagerImage?: string;
  inviterId: string;
  inviterName?: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

interface UseWagerInvitesReturn {
  invitations: WagerInvitation[];
  pendingInvitations: WagerInvitation[];
  loading: boolean;
  error: Error | null;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  declineInvitation: (invitationId: string) => Promise<boolean>;
  refreshInvitations: () => Promise<void>;
}

interface UserData extends DocumentData {
  nickname?: string;
  firstName?: string;
  lastName?: string;
}

export function useWagerInvites(): UseWagerInvitesReturn {
  const [invitations, setInvitations] = useState<WagerInvitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<WagerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([]);
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const invitationsRef = collection(firestore, 'wager_invitations');
      const q = query(
        invitationsRef,
        where('inviteeId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const now = Timestamp.now();

      // Fetch wager and inviter details for each invitation
      const invitationsWithDetails = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          let wagerTitle = 'Unknown Wager';
          let wagerImage = '/images/placeholders/wager-default.jpg';
          let inviterName = 'Someone';

          try {
            // Get wager details
            const wagerDocRef = doc(firestore, 'wagers', data.wagerId);
            const wagerDocSnap = await getDoc(wagerDocRef);
            
            if (wagerDocSnap.exists()) {
              const wagerData = wagerDocSnap.data() as Wager;
              wagerTitle = wagerData.title || 'Unnamed Wager';
              wagerImage = wagerData.image || '/images/placeholders/wager-default.jpg';
            }

            // Get inviter details
            const inviterDocRef = doc(firestore, 'users', data.inviterId);
            const inviterDocSnap = await getDoc(inviterDocRef);
            
            if (inviterDocSnap.exists()) {
              const inviterData = inviterDocSnap.data() as UserData;
              inviterName = inviterData.nickname || 
                `${inviterData.firstName || ''} ${inviterData.lastName || ''}`.trim() || 
                'User';
            }
          } catch (error) {
            console.error('Error fetching wager or inviter details:', error);
          }

          // Check if invitation has expired
          let status = data.status;
          if (status === 'pending' && data.expiresAt.toDate() < now.toDate()) {
            status = 'expired';
            // Update the status in Firestore
            const invitationDocRef = doc(firestore, 'wager_invitations', docSnapshot.id);
            await updateDoc(invitationDocRef, {
              status: 'expired'
            });
          }

          return {
            id: docSnapshot.id,
            wagerId: data.wagerId,
            wagerTitle,
            wagerImage,
            inviterId: data.inviterId,
            inviterName,
            inviteeId: data.inviteeId,
            status,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt
          } as WagerInvitation;
        })
      );

      setInvitations(invitationsWithDetails);
      setPendingInvitations(invitationsWithDetails.filter(inv => inv.status === 'pending'));
    } catch (err) {
      console.error('Error fetching wager invitations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch invitations'));
    } finally {
      setLoading(false);
    }
  }, [firestore, user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const invitationRef = doc(firestore, 'wager_invitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);

      if (!invitationDoc.exists()) {
        toast({
          title: 'Invitation not found',
          description: 'This invitation no longer exists',
          variant: 'destructive',
        });
        return false;
      }

      const invitationData = invitationDoc.data();
      
      // Check if invitation has expired
      if (invitationData.expiresAt.toDate() < new Date()) {
        toast({
          title: 'Invitation expired',
          description: 'This invitation has expired',
          variant: 'destructive',
        });
        await updateDoc(invitationRef, { status: 'expired' });
        await fetchInvitations();
        return false;
      }

      // Update invitation status
      await updateDoc(invitationRef, { 
        status: 'accepted',
        updatedAt: Timestamp.now()
      });

      // Get the wager and add the user to participants if needed
      const wagerRef = doc(firestore, 'wagers', invitationData.wagerId);
      const wagerDoc = await getDoc(wagerRef);

      if (wagerDoc.exists()) {
        const wagerData = wagerDoc.data();
        
        // Add user to participants list if it exists
        if (wagerData.participants) {
          await updateDoc(wagerRef, {
            participants: [...wagerData.participants, user.uid]
          });
        } else {
          // Create participants array if it doesn't exist
          await updateDoc(wagerRef, {
            participants: [user.uid]
          });
        }
      }

      toast({
        title: 'Invitation accepted',
        description: 'You have joined the wager',
      });

      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Failed to accept invitation',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  const declineInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const invitationRef = doc(firestore, 'wager_invitations', invitationId);
      await updateDoc(invitationRef, { 
        status: 'declined',
        updatedAt: Timestamp.now()
      });

      toast({
        title: 'Invitation declined',
        description: 'You have declined the wager invitation',
      });

      await fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Failed to decline invitation',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    invitations,
    pendingInvitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation,
    refreshInvitations: fetchInvitations
  };
}

export default useWagerInvites;