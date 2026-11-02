'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type FriendshipState = 'loading' | 'none' | 'pending-sent' | 'accepted';

interface FriendshipButtonProps {
  /** The id of the profile being viewed (NOT the current user) */
  profileUserId: string;
}

export default function FriendshipButton({ profileUserId }: FriendshipButtonProps) {
  const { toast } = useToast();
  const [state,        setState]        = useState<FriendshipState>('loading');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [busy,         setBusy]         = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function deriveState() {
      try {
        // Check accepted friends list
        const [friendsRes, sentRes] = await Promise.all([
          fetch('/api/friends'),
          fetch('/api/friends?type=sent'),
        ]);
        if (!friendsRes.ok || !sentRes.ok) throw new Error('fetch failed');

        const [friendsData, sentData] = await Promise.all([
          friendsRes.json(),
          sentRes.json(),
        ]);

        if (cancelled) return;

        const accepted = (friendsData.friends ?? []).find(
          (f: any) => f.friendId === profileUserId
        );
        if (accepted) {
          setState('accepted');
          setFriendshipId(accepted.id);
          return;
        }

        const pending = (sentData.sent ?? []).find(
          (s: any) => s.addresseeId === profileUserId
        );
        if (pending) {
          setState('pending-sent');
          setFriendshipId(pending.id);
          return;
        }

        setState('none');
        setFriendshipId(null);
      } catch {
        if (!cancelled) setState('none');
      }
    }

    deriveState();
    return () => { cancelled = true; };
  }, [profileUserId]);

  const handleAddFriend = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: profileUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed');
      setState('pending-sent');
      setFriendshipId(data.friendship?.id ?? null);
      toast({ title: 'Friend request sent!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!friendshipId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setState('none');
      setFriendshipId(null);
      toast({ title: state === 'accepted' ? 'Unfriended' : 'Request cancelled' });
    } catch {
      toast({ title: 'Error', description: 'Action failed.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') {
    return (
      <Button variant="outline" disabled size="sm">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (state === 'none') {
    return (
      <Button
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white"
        onClick={handleAddFriend}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
        Add Friend
      </Button>
    );
  }

  if (state === 'pending-sent') {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-gray-600 dark:text-gray-300"
        onClick={handleRemove}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
        Cancel Request
      </Button>
    );
  }

  // accepted
  return (
    <Button
      size="sm"
      variant="outline"
      className="text-red-600 border-red-300 hover:bg-red-50"
      onClick={handleRemove}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
      Unfriend
    </Button>
  );
}
