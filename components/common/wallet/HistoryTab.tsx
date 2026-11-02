// components/common/wallet/HistoryTab.tsx
import React, { useState } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTransactionStatus } from '@/lib/transaction';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import type { Transaction, Settings } from '@/components/common/wallet/types';

interface HistoryTabProps {
  transactions?: Transaction[];
  settings: Settings | null;
  showOnlyDeposits: boolean;
  showOnlyWithdrawals: boolean;
  setShowOnlyDeposits: (show: boolean) => void;
  setShowOnlyWithdrawals: (show: boolean) => void;
}

const ITEMS_PER_PAGE = 5;

export default function HistoryTab({
  transactions = [],
  settings,
  showOnlyDeposits,
  showOnlyWithdrawals,
  setShowOnlyDeposits,
  setShowOnlyWithdrawals
}: HistoryTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // ✅ Safe filtering
  const filteredTransactions = transactions.filter((t) => {
    if (showOnlyDeposits && !showOnlyWithdrawals) return t.type === "deposit";
    if (showOnlyWithdrawals && !showOnlyDeposits) return t.type === "withdrawal";
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Filter Switches */}
      <div className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <Switch.Root
            checked={showOnlyDeposits}
            onCheckedChange={setShowOnlyDeposits}
            className="w-[42px] h-[25px] bg-gray-300 dark:bg-gray-600 rounded-full relative data-[state=checked]:bg-purple-600 outline-none cursor-default"
          >
            <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
          </Switch.Root>
          <label className="text-sm text-gray-700 dark:text-gray-300">Deposits</label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch.Root
            checked={showOnlyWithdrawals}
            onCheckedChange={setShowOnlyWithdrawals}
            className="w-[42px] h-[25px] bg-gray-300 dark:bg-gray-600 rounded-full relative data-[state=checked]:bg-purple-600 outline-none cursor-default"
          >
            <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
          </Switch.Root>
          <label className="text-sm text-gray-700 dark:text-gray-300">Withdrawals</label>
        </div>
      </div>

      {/* Transactions List */}
      <AnimatePresence mode="wait">
        {paginatedTransactions.length > 0 ? (
          <motion.ul
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {paginatedTransactions.map((transaction, index) => {
              const statusStyle = formatTransactionStatus(transaction.status);
              return (
                <motion.li
                  key={transaction.reference}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <span className="font-medium bg-slate-200 dark:bg-slate-800 rounded-md px-2 py-1 text-xs uppercase text-gray-500 dark:text-gray-400">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                      <span className={`font-medium text-xs rounded-md px-2 py-1 ${statusStyle.className}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString()}
                      </p>
                      {transaction.type === 'withdrawal' && transaction.accountDetails && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.accountDetails.bankName} - {transaction.accountDetails.accountNumber}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Ref: {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`text-sm font-semibold ${transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                      }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toLocaleString()} {settings?.currencySymbol || '₦'}
                    </span>
                    {transaction.bonusAwarded && (
                      <p className="text-sm text-green-500">
                        +{transaction.bonusAwarded.toLocaleString()} {settings?.currencySymbol || '₦'} Bonus
                      </p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            <p>No transactions found.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <TransactionDetailsDialog
          isOpen={!!selectedTransaction}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          settings={settings}
        />
      )}
    </div>
  );
}