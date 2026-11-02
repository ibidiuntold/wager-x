'use client';

import React, { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DeleteWagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wagerTitle: string;
  onConfirm: () => Promise<void>;
  isProcessing?: boolean;
  participantsCount: number;
  totalPool: number;
}

const DeleteWagerDialog: React.FC<DeleteWagerDialogProps> = ({
  isOpen,
  onOpenChange,
  wagerTitle,
  onConfirm,
  isProcessing = false,
  participantsCount,
  totalPool
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText.toLowerCase() === 'delete';

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (!isConfirmValid) {
      setError('Please type "delete" to confirm');
      return;
    }

    try {
      await onConfirm();
    } catch (err) {
      console.error('Error deleting wager:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the wager');
    }
  };

  const resetDialog = () => {
    setConfirmText('');
    setError(null);
  };

  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
      }}
    >
      <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trash2 className="w-6 h-6 text-red-600 mr-2" />
            Delete Wager
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            You are about to delete the wager "{wagerTitle}". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
              <div className="space-y-1">
                <p className="text-sm text-red-800 dark:text-red-300">
                  This wager has {participantsCount} participant{participantsCount !== 1 ? 's' : ''} with a total pool of ₦{totalPool.toLocaleString()}.
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  Deleting this wager will refund all participants their original bet amounts.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                To confirm, type "delete" below:
              </label>
              <Input
                type="text"
                value={confirmText}
                onChange={handleConfirmChange}
                placeholder="delete"
                className="w-full"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel 
            onClick={resetDialog}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isProcessing || !isConfirmValid}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              'Delete Wager'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteWagerDialog;