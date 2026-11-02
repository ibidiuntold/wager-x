// components/modals/CashoutModal.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashoutAmount: number;
  isCashingOut: boolean;
  onConfirm: () => void;
}

const CashoutModal: React.FC<CashoutModalProps> = ({
  isOpen,
  onClose,
  cashoutAmount,
  isCashingOut,
  onConfirm
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            Confirm Cashout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
            Are you sure you want to cash out? You will receive{' '}
            <span className="font-semibold text-green-600 dark:text-green-400">
              ₦{cashoutAmount.toLocaleString()}
            </span>{' '}
            back (a 20% fee is applied).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isCashingOut}
            className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isCashingOut}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isCashingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isCashingOut ? 'Cashing Out...' : 'Confirm Cashout'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CashoutModal;
