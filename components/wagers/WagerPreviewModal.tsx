'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Wager } from './WagerSearchModal';
import Image from 'next/image';
import { format } from 'date-fns';

interface WagerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
  wager: Wager;
}

const WagerPreviewModal: React.FC<WagerPreviewModalProps> = ({ isOpen, onClose, onRequireAuth, wager }) => {
  const router = useRouter();
  const { data: session } = useSession();

  if (!wager) return null;

  const handleJoinWager = () => {
    if (!session) {
      onRequireAuth();
    } else {
      router.push(`/wagers/${wager.slug}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 text-black dark:text-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-2">{wager.title}</DialogTitle>
          <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
            {wager.category}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col items-center">
          {wager.image && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
              <Image
                src={wager.image}
                alt={wager.title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}
          <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-4">{wager.description}</p>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Current Pool:</span>
              <span className="text-green-500 font-bold">${wager.totalPool}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Minimum Entry:</span>
              <span>${wager.minimumEntry}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Expires:</span>
              <span>{format(new Date(wager.expiresAt), 'PPP p')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Status:</span>
              <span className={`font-bold ${wager.status === 'open' ? 'text-blue-500' : 'text-red-500'}`}>{wager.status}</span>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button
            onClick={handleJoinWager}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Join Wager
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WagerPreviewModal;