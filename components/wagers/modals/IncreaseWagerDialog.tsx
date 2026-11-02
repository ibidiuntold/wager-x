import { Input } from "@/components/ui/input";
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  
  interface IncreaseWagerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    currentAmount: number;
    increaseAmount: string;
    onAmountChange: (value: string) => void;
    onConfirm: () => void;
    isProcessing?: boolean;
  }
  
  export const IncreaseWagerDialog = ({
    isOpen,
    onOpenChange,
    currentAmount,
    increaseAmount,
    onAmountChange,
    onConfirm,
    isProcessing
  }: IncreaseWagerDialogProps) => {
    return (
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Increase Your Bet
            </AlertDialogTitle>
            <div className="text-gray-600 dark:text-gray-300 mt-2">
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Current Bet</p>
                    <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                      ₦{currentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount to Add
                  </label>
                  <Input
                    type="number"
                    value={increaseAmount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isProcessing || !increaseAmount || Number(increaseAmount) <= 0}
              className="bg-purple-600 hover:bg-purple-700 text-white border-0"
            >
              {isProcessing ? "Processing..." : "Increase Bet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };