'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { slugify } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import type { Wager } from '@/types/game.types';

export interface WagerFormValues {
  title: string;
  description: string;
  category: string;
  image: string;
  options: { name: string }[];
  totalPool: number;
  expiresAt: Date;
  isPublic: boolean;
  creatorId: string;
}

interface UseWagerCreatorReturn {
  createWager: (values: WagerFormValues) => Promise<{
    success: boolean;
    wagerId?: string;
    wagerSlug?: string;
    error?: string
  }>;
  updateWager: (wagerId: string, values: Partial<WagerFormValues>) => Promise<{ success: boolean; error?: string }>;
  inviteFriends: (wagerId: string, friendIds: string[]) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export function useWagerCreator(): UseWagerCreatorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  const createWager = async (values: WagerFormValues) => {
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to create a wager'
      };
    }

    setIsLoading(true);

    try {
      const baseSlug = slugify(values.title);
      const uniqueId = uuidv4().substring(0, 8);
      const slug = `${baseSlug}-${uniqueId}`;

      const response = await fetch('/api/wagers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          slug,
          userId: session.user.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);

        return {
          success: true,
          wagerId: String(data.wagerId),
          wagerSlug: slug
        };
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch:", response.status, errorText);

        return {
          success: false,
          error: `Failed to create wager: ${errorText || response.statusText}`
        };
      }


    } catch (error) {
      console.error('Error creating wager:', error);
      toast({
        title: 'Error creating wager',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create wager'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateWager = async (wagerId: string, values: Partial<WagerFormValues>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wagers/${wagerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('Failed to update wager');
      }

      return { success: true };
    } catch (error) {
      toast({
        title: 'Error updating wager',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update wager' };
    } finally {
      setIsLoading(false);
    }
  };

  const inviteFriends = async (wagerId: string, friendIds: string[]) => {
    try {
      const response = await fetch(`/api/wagers/${wagerId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendIds })
      });

      if (!response.ok) {
        throw new Error('Failed to invite friends');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invite friends'
      };
    }
  };

  return {
    createWager,
    updateWager,
    inviteFriends,
    isLoading
  };
}

export default useWagerCreator;
