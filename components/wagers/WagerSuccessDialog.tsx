'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Mail, Link, Check, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WagerSuccessAnimation } from './WagerSuccessAnimation';

interface WagerSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wagerId: string;
  wagerSlug: string;
  wagerTitle: string;
}

export const WagerSuccessDialog: React.FC<WagerSuccessDialogProps> = ({
  isOpen,
  onOpenChange,
  wagerId,
  wagerSlug,
  wagerTitle,
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  
  const inviteLink = `${baseUrl}/wagers/${wagerSlug}`;

  // Handle dialog close - redirect to the wager page
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Short delay to allow animation to complete
      setTimeout(() => {
        router.push(`/wagers/${wagerSlug}`);
      }, 100);
    }
    onOpenChange(open);
  };

  const handleCopyInviteLink = () => {
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

  const handleEmailInvite = async () => {
    if (!emailInput.trim() || !isValidEmail(emailInput)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsEmailSending(true);
    
    try {
      // Call your API endpoint to send email
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailInput,
          template: 'wagerInvite',
          params: {
            wagerTitle: wagerTitle,
            wagerDescription: 'Join this wager!', // Placeholder, actual wager description would need to be fetched
            inviteUrl: inviteLink,
            displayName: 'Friend', 
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send invitation email');
      }

      toast({
        title: "Invitation Sent",
        description: `Invitation email sent to ${emailInput}`,
      });

      setEmailInput('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Failed to Send Invitation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleViewWager = () => {
    router.push(`/wagers/${wagerSlug}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <WagerSuccessAnimation className="mt-2 mb-6" />
        
        <DialogHeader>
          <DialogTitle className="text-center">
            Wager Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Your wager "{wagerTitle}" has been created. Invite others to participate!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Invite</TabsTrigger>
            <TabsTrigger value="link">Share Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Invite via email</Label>
              <div className="flex space-x-2">
                <Input 
                  id="email"
                  placeholder="Enter email address" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  type="email"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleEmailInvite}
                  disabled={isEmailSending}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                We'll send an invitation with details about your wager.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link">Share this link</Label>
              <div className="flex space-x-2">
                <Input 
                  id="link"
                  value={inviteLink} 
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
              <p className="text-xs text-gray-500">
                Share this link with anyone you want to invite to your wager.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
          >
            Done
          </Button>
          <Button onClick={handleViewWager}>
            <Share2 className="h-4 w-4 mr-2" />
            View Wager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WagerSuccessDialog;