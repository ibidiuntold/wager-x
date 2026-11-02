import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CashoutButtonProps {
  amount: number;
  isProcessing: boolean;
  onClick: () => void;
}

export const CashoutButton: React.FC<CashoutButtonProps> = ({
  amount,
  isProcessing,
  onClick
}) => (
  <Button
    variant="outline"
    className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
    onClick={onClick}
    disabled={isProcessing}
  >
    {isProcessing ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Processing...
      </>
    ) : (
      `Cashout ₦${amount.toLocaleString()}`
    )}
  </Button>
);