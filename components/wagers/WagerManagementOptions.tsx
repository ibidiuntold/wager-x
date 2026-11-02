'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import EndWagerDialog from './EndWagerDialog';
import DeleteWagerDialog from './DeleteWagerDialog';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface WagerManagementOptionsProps {
  wager: {
    id: string;
    title: string;
    status: string;
    options: Array<{ name: string; odds: number }>;
    totalPool: number;
  };
  isCreator: boolean;
  participantsCount: number;
  onEndWager: (winningOption: string) => Promise<void>;
  onDeleteWager: () => Promise<void>;
  disabled?: boolean;
  isExpired?: boolean;
}

const WagerManagementOptions: React.FC<WagerManagementOptionsProps> = ({
  wager,
  isCreator,
  participantsCount,
  onEndWager,
  onDeleteWager,
  disabled = false,
  isExpired = false
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEndingWager, setIsEndingWager] = useState(false);
  const [isDeletingWager, setIsDeletingWager] = useState(false);

  // If user is not the creator, don't show management options
  if (!isCreator) return null;

  const handleEndWager = async (winningOption: string) => {
    try {
      setIsEndingWager(true);
      await onEndWager(winningOption);
      
      toast({
        title: 'Wager Ended Successfully',
        description: `Winnings have been distributed to "${winningOption}" voters`,
      });
      
      setShowEndDialog(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to end wager:', error);
      toast({
        title: 'Failed to End Wager',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsEndingWager(false);
    }
  };

  const handleDeleteWager = async () => {
    try {
      setIsDeletingWager(true);
      await onDeleteWager();
      
      toast({
        title: 'Wager Deleted',
        description: 'The wager has been deleted and all participants have been refunded',
      });
      
      setShowDeleteDialog(false);
      router.push('/wagers');
    } catch (error) {
      console.error('Failed to delete wager:', error);
      toast({
        title: 'Failed to Delete Wager',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingWager(false);
    }
  };

  // Don't show management options for completed or cancelled wagers
  if (wager.status !== 'open') {
    return (
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-0">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm">
            This wager has been {wager.status === 'completed' ? 'completed' : wager.status}. No further actions are available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wager Management</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={disabled || isEndingWager || isDeletingWager}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowEndDialog(true)}
                  className="cursor-pointer"
                  disabled={participantsCount === 0 || isExpired}
                >
                  <Trophy className="mr-2 h-4 w-4 text-purple-600" />
                  <span>End Wager</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Wager</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              As the creator of this wager, you can manage it using the options below:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowEndDialog(true)}
                disabled={disabled || participantsCount === 0 || isExpired}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Trophy className="mr-2 h-4 w-4" />
                End Wager
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={disabled}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
            {participantsCount === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This wager cannot be ended until it has participants.
              </p>
            )}
            {isExpired && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This wager has expired. You can only delete it.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* End Wager Dialog */}
      <EndWagerDialog
        isOpen={showEndDialog}
        onOpenChange={setShowEndDialog}
        wagerTitle={wager.title}
        options={wager.options}
        onConfirm={handleEndWager}
        isProcessing={isEndingWager}
      />

      {/* Delete Wager Dialog */}
      <DeleteWagerDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        wagerTitle={wager.title}
        onConfirm={handleDeleteWager}
        isProcessing={isDeletingWager}
        participantsCount={participantsCount}
        totalPool={wager.totalPool}
      />
    </>
  );
};

export default WagerManagementOptions;