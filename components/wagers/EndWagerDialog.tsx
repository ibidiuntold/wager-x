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
import { Loader2, Trophy, AlertTriangle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface EndWagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wagerTitle: string;
  options: Array<{ name: string; odds: number }>;
  onConfirm: (winningOption: string) => Promise<void>;
  isProcessing?: boolean;
}

const EndWagerDialog: React.FC<EndWagerDialogProps> = ({
  isOpen,
  onOpenChange,
  wagerTitle,
  options,
  onConfirm,
  isProcessing = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('Please select a winning option');
      return;
    }

    try {
      await onConfirm(selectedOption);
    } catch (err) {
      console.error('Error ending wager:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while ending the wager');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trophy className="w-6 h-6 text-purple-600 mr-2" />
            End Wager
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            You are about to end the wager "{wagerTitle}". This action will resolve the wager, distribute winnings to the winning side, and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-2" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Once you end this wager, the winning option will receive the entire pool amount proportional to their contributions. This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-base font-medium">Select the winning option:</Label>
            
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
              {options.map((option) => (
                <div key={option.name} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <RadioGroupItem value={option.name} id={option.name} />
                  <Label htmlFor={option.name} className="flex-grow text-base cursor-pointer">{option.name}</Label>
                </div>
              ))}
            </RadioGroup>
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel 
            onClick={() => {
              setSelectedOption('');
              setError(null);
            }}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isProcessing || !selectedOption}
            className="bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              'End Wager & Distribute Winnings'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndWagerDialog;