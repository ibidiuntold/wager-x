import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle } from 'lucide-react';

interface CreditDebitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, remark: string) => void;
  type: 'credit' | 'debit';
  userId: string;
}

const CreditDebitForm: React.FC<CreditDebitFormProps> = ({ isOpen, onClose, onSubmit, type, userId }) => {
  const [amount, setAmount] = useState<string>('');
  const [remark, setRemark] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(Number(amount), remark);
    setAmount('');
    setRemark('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === 'credit' ? 'Credit Balance' : 'Debit Balance'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-gray-700 dark:text-gray-300">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="remark" className="text-gray-700 dark:text-gray-300">Remark</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter remark"
              className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:bg-gray-700 dark:text-white">
              Cancel
            </Button>
            <Button type="submit" className={type === 'credit' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
              {type === 'credit' ? <PlusCircle className="mr-2 h-4 w-4" /> : <MinusCircle className="mr-2 h-4 w-4" />}
              {type === 'credit' ? 'Credit' : 'Debit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreditDebitForm;