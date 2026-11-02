// components/common/wallet/TransactionDetailsDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Printer, ArrowUpRight } from 'lucide-react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf 
} from '@react-pdf/renderer';
import type { Transaction, Settings } from '@/components/common/wallet/types'; 

const createTransactionPdf = (transaction: Transaction, settings?: Settings | null) => {
  const styles = StyleSheet.create({
    page: {
      padding: 30,
      backgroundColor: 'white',
    },
    header: {
      marginBottom: 20,
      borderBottom: 1,
      paddingBottom: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    section: {
      marginBottom: 15,
    },
    row: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    label: {
      width: 120,
      fontSize: 12,
      color: '#666',
    },
    value: {
      flex: 1,
      fontSize: 12,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction Details</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>
              {settings?.currencySymbol || '₦'}{transaction.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {new Date(transaction.date).toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference:</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
          
          {transaction.type === 'withdrawal' && transaction.accountDetails && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Bank:</Text>
                <Text style={styles.value}>{transaction.accountDetails.bankName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Account Number:</Text>
                <Text style={styles.value}>{transaction.accountDetails.accountNumber}</Text>
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
};

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  settings: Settings | null;
}

export function TransactionDetailsDialog({ 
  isOpen, 
  transaction, 
  onClose,
  settings
}: TransactionDetailsDialogProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePdfAndShare = async () => {
    if (!transaction) return;

    setIsGeneratingPdf(true);
    try {
      // Generate PDF blob
      const pdfBlob = await pdf(createTransactionPdf(transaction, settings)).toBlob();

      // Check if Web Share API is available
      if (navigator.share) {
        const file = new File([pdfBlob], `transaction_${transaction.reference}.pdf`, {
          type: 'application/pdf',
        });

        await navigator.share({
          title: 'Transaction Details',
          text: `Transaction details for reference ${transaction.reference}`,
          files: [file]
        });
      } else {
        // Fallback: Trigger download
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction_${transaction.reference}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating/sharing PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Type and Status */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <span className="bg-slate-200 dark:bg-slate-800 rounded-md px-2 py-1 text-xs uppercase text-gray-500 dark:text-gray-400">
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </span>
              <span className={`rounded-md px-2 py-1 text-xs ${
                transaction.status === 'success' ? 'bg-green-200 text-green-800' :
                transaction.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                'bg-red-200 text-red-800'
              }`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
            <span className={`font-semibold ${
              transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
            }`}>
              {transaction.type === 'deposit' ? '+' : '-'}
              {settings?.currencySymbol || '₦'}{transaction.amount.toLocaleString()}
            </span>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span>{new Date(transaction.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reference</span>
              <span>{transaction.reference}</span>
            </div>
            {transaction.type === 'withdrawal' && transaction.accountDetails && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bank</span>
                  <span>{transaction.accountDetails.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account Number</span>
                  <span>{transaction.accountDetails.accountNumber}</span>
                </div>
              </>
            )}
            {transaction.bonusAwarded && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bonus Awarded</span>
                <span className="text-green-500">
                  {settings?.currencySymbol || '₦'}{transaction.bonusAwarded.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={generatePdfAndShare}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <Printer className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Share Details
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // TODO: Implement detailed view or open in browser
              }}
            >
              View Details
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}