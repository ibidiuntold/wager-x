import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Search, Mail, Link, Check, X } from 'lucide-react';
// Remove: import { useFirestore } from '@/hooks/useFirestore';
// Remove: import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  email: string;
  selected: boolean;
}

interface InviteFriendsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (friendIds: string[]) => void;
  initialSelectedFriends?: string[];
  wagerId?: string;
  wagerTitle?: string;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onOpenChange,
  onInvite,
  initialSelectedFriends = [],
  wagerId,
  wagerTitle,
}) => {
  const { toast } = useToast();
  // Remove: const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>(initialSelectedFriends);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedFriends(initialSelectedFriends);
  }, [initialSelectedFriends]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      // Replace Firestore logic with REST API call
      const res = await fetch('/api/friends');
      if (res.ok) {
        const data = await res.json();
        const friendsData: Friend[] = (data.friends ?? []).map((f: any) => ({
          id:        f.friendId,
          name:      f.friendNickname ?? f.friendId,
          username:  f.friendNickname ?? f.friendId,
          avatarUrl: f.friendAvatarUrl ?? '',
          email:     '',
          selected:  false,
        }));
        setFriends(friendsData);
      } else {
        throw new Error('Failed to fetch friends');
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Failed to load friends",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter friends based on search term
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFriend = (friendId: string) => {
    setFriends(prevFriends => 
      prevFriends.map(friend => 
        friend.id === friendId 
          ? { ...friend, selected: !friend.selected } 
          : friend
      )
    );
    
    setSelectedFriends(prev => {
      const isSelected = prev.includes(friendId);
      return isSelected 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId];
    });
  };

  const handleCopyInviteLink = () => {
    const inviteLink = wagerId 
      ? `${window.location.origin}/wagers/invite/${wagerId}`
      : `${window.location.origin}/wagers/invite/placeholder`;

    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setLinkCopied(true);
        toast({
          title: "Link Copied",
          description: "Invite link has been copied to clipboard",
        });
        
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Failed to Copy",
          description: "Could not copy the invite link",
          variant: "destructive"
        });
      });
  };

  const handleEmailInvite = () => {
    if (!emailInput.trim() || !isValidEmail(emailInput)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // In a real application, you'd implement the logic to send an email invitation

    toast({
      title: "Invitation Sent",
      description: `Invitation email sent to ${emailInput}`,
    });

    setEmailInput('');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = () => {
    onInvite(selectedFriends);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            {wagerTitle 
              ? `Invite friends to join '${wagerTitle}'`
              : 'Invite friends to join your wager'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Friends List */}
          <div className="border rounded-md border-gray-200 dark:border-gray-700">
            <ScrollArea className="h-[240px] rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No matching friends found" : "No friends available"}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredFriends.map((friend) => (
                    <div 
                      key={friend.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={friend.avatarUrl} 
                            alt={friend.name} 
                          />
                          <AvatarFallback>
                            {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{friend.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{friend.username}</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => handleToggleFriend(friend.id)}
                        aria-label={`Select ${friend.name}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Email Invite */}
          <div className="space-y-2">
            <Label>Or invite via email</Label>
            <div className="flex space-x-2">
              <Input 
                placeholder="Enter email address" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                type="email"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleEmailInvite}
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label>Share invite link</Label>
            <div className="flex space-x-2">
              <Input 
                value={wagerId 
                  ? `${window.location.origin}/wagers/invite/${wagerId}`
                  : `${window.location.origin}/wagers/invite/placeholder`
                } 
                readOnly 
                className="bg-gray-50 dark:bg-gray-800"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyInviteLink}
              >
                {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Link className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Selected Friends Summary */}
          {selectedFriends.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Selected Friends ({selectedFriends.length})</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedFriends([]);
                    setFriends(friends => friends.map(f => ({ ...f, selected: false })));
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFriends.map(id => {
                  const friend = friends.find(f => f.id === id);
                  if (!friend) return null;
                  
                  return (
                    <div 
                      key={id}
                      className="flex items-center space-x-1 bg-white dark:bg-gray-700 px-2 py-1 rounded-full text-xs"
                    >
                      <span>{friend.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 rounded-full" 
                        onClick={() => handleToggleFriend(id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Invite Selected ({selectedFriends.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendsModal;