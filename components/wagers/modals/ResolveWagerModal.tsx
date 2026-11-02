// components/modals/ResolveWagerModal.tsx
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
import { cn } from '@/lib/utils';
import { ProcessedOption } from '@/types/wager';

interface ResolveWagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedOptions: ProcessedOption[];
  resolvingOption: string;
  setResolvingOption: (option: string) => void;
  isResolving: boolean;
  onConfirm: () => void;
}

const ResolveWagerModal: React.FC<ResolveWagerModalProps> = ({
  isOpen,
  onClose,
  processedOptions,
  resolvingOption,
  setResolvingOption,
  isResolving,
  onConfirm
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">
            Resolve Wager
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
            Select the winning option to resolve this wager and distribute the pool. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Winning Option
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {processedOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => setResolvingOption(option.name)}
                className={cn(
                  "flex flex-col h-auto p-4 rounded-lg transition-all duration-200",
                  resolvingOption === option.name
                    ? "border-green-600 bg-green-600 text-white hover:bg-green-700"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <span className="text-lg font-semibold">{option.name}</span>
              </Button>
            ))}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isResolving}
            className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isResolving || !resolvingOption}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isResolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isResolving ? 'Resolving...' : 'Resolve Wager'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResolveWagerModal;
