'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Users, UserCheck, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type TabType = 'friends' | 'requests' | 'sent';

interface FriendEntry {
  id: string;          // friendship row id
  friendId: string;
  friendNickname: string | null;
  friendAvatarUrl: string | null;
}

interface RequestEntry {
  id: string;
  requesterId: string;
  requesterNickname: string | null;
  requesterAvatarUrl: string | null;
}

interface SentEntry {
  id: string;
  addresseeId: string;
  addresseeNickname: string | null;
  addresseeAvatarUrl: string | null;
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">{message}</p>
    </div>
  );
}

export default function FriendsView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends,   setFriends]   = useState<FriendEntry[]>([]);
  const [requests,  setRequests]  = useState<RequestEntry[]>([]);
  const [sent,      setSent]      = useState<SentEntry[]>([]);
  const [loading,   setLoading]   = useState(false);

  const fetchTab = useCallback(async (tab: TabType) => {
    setLoading(true);
    try {
      const url = tab === 'friends'
        ? '/api/friends'
        : tab === 'requests'
        ? '/api/friends?type=requests'
        : '/api/friends?type=sent';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (tab === 'friends')  setFriends(data.friends ?? []);
      if (tab === 'requests') setRequests(data.requests ?? []);
      if (tab === 'sent')     setSent(data.sent ?? []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchTab(activeTab); }, [activeTab, fetchTab]);

  const handleAction = async (
    method: 'PUT' | 'DELETE',
    id: string,
    body?: object
  ) => {
    try {
      const res = await fetch(`/api/friends/${id}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error('Action failed');
      fetchTab(activeTab);
    } catch {
      toast({ title: 'Error', description: 'Action failed. Please try again.', variant: 'destructive' });
    }
  };

  const renderFriends = () => {
    if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>;
    if (friends.length === 0) return <EmptyState icon={Users} message="You have no friends yet. Start connecting!" />;
    return (
      <div className="space-y-2">
        {friends.map(f => (
          <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={f.friendAvatarUrl ?? ''} alt={f.friendNickname ?? 'User'} />
              <AvatarFallback className="bg-purple-600 text-white text-sm">
                {(f.friendNickname ?? 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {f.friendNickname ?? 'Anonymous'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              onClick={() => handleAction('DELETE', f.id)}
            >
              Unfriend
            </Button>
          </div>
        ))}
      </div>
    );
  };

  const renderRequests = () => {
    if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>;
    if (requests.length === 0) return <EmptyState icon={UserCheck} message="No pending friend requests." />;
    return (
      <div className="space-y-2">
        {requests.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={r.requesterAvatarUrl ?? ''} alt={r.requesterNickname ?? 'User'} />
              <AvatarFallback className="bg-purple-600 text-white text-sm">
                {(r.requesterNickname ?? 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {r.requesterNickname ?? 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sent you a friend request</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleAction('PUT', r.id, { status: 'accepted' })}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('PUT', r.id, { status: 'rejected' })}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSent = () => {
    if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>;
    if (sent.length === 0) return <EmptyState icon={Clock} message="No outgoing requests." />;
    return (
      <div className="space-y-2">
        {sent.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={s.addresseeAvatarUrl ?? ''} alt={s.addresseeNickname ?? 'User'} />
              <AvatarFallback className="bg-purple-600 text-white text-sm">
                {(s.addresseeNickname ?? 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {s.addresseeNickname ?? 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Request pending</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-gray-600 dark:text-gray-300 shrink-0"
              onClick={() => handleAction('DELETE', s.id)}
            >
              Cancel
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-20 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-7 w-7 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Friends</h1>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabType)}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="friends"  className="flex-1">My Friends</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests
            {requests.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
        </TabsList>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
          <TabsContent value="friends"  className="mt-0">{renderFriends()}</TabsContent>
          <TabsContent value="requests" className="mt-0">{renderRequests()}</TabsContent>
          <TabsContent value="sent"     className="mt-0">{renderSent()}</TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
