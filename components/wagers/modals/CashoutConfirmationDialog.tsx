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
  
  interface CashoutConfirmationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    onConfirm: () => void;
    isProcessing: boolean;
  }
  
  export const CashoutConfirmationDialog = ({
    isOpen,
    onOpenChange,
    amount,
    onConfirm,
    isProcessing
  }: CashoutConfirmationDialogProps) => {
    return (
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Confirm Cashout
            </AlertDialogTitle>
            <div className="text-gray-600 dark:text-gray-300 mt-2">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Amount to Cashout</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₦{amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <AlertDialogDescription className="text-sm text-gray-500">
                  By cashing out, you will withdraw from this wager and the amount will be returned to your wallet. This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              {isProcessing ? "Processing..." : "Confirm Cashout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };