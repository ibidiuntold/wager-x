import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import InviteFriendsModal from './InviteFriendsModal';
import { useToast } from '@/components/ui/use-toast';

interface WagerInviteButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  wagerId: string;
  wagerTitle?: string;
  invitedFriends?: string[];
}

export const WagerInviteButton: React.FC<WagerInviteButtonProps> = ({
  className = '',
  variant = 'outline',
  size = 'default',
  showText = true,
  wagerId,
  wagerTitle = 'Wager',
  invitedFriends = []
}) => {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const isSignedIn = status === 'authenticated';
  const userId = session?.user?.id;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleClick = () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to invite friends to this wager",
        variant: "destructive"
      });
      return;
    }
    
    setIsModalOpen(true);
  };

  const handleInviteFriends = async (selectedFriendIds: string[]) => {
    if (!isSignedIn || !userId || !wagerId) return;
    
    try {
      setIsInviting(true);

      const res = await fetch(`/api/wagers/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wagerId }),
      });
      if (!res.ok) throw new Error('Failed to send invite');

      // In a real app, you might want to send notifications, emails, etc.
      
      toast({
        title: "Friends Invited",
        description: `Successfully invited ${selectedFriendIds.length} friends to the wager`,
      });
    } catch (error) {
      console.error("Error inviting friends:", error);
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : "Failed to invite friends",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        disabled={isInviting}
      >
        <UserPlus className={`h-4 w-4 ${showText ? 'mr-2' : ''}`} />
        {showText && 'Invite Friends'}
      </Button>

      <InviteFriendsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onInvite={handleInviteFriends}
        initialSelectedFriends={invitedFriends}
        wagerId={wagerId}
        wagerTitle={wagerTitle}
      />
    </>
  );
};

export default WagerInviteButton;