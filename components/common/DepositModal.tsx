import React, { useState } from 'react';
import { X, ChevronDown, Wallet } from 'lucide-react';

interface DepositModalProps {
  onClose: () => void;
  onDeposit: (amount: number) => void;
  initialAmount?: number;
}

const DepositModal: React.FC<DepositModalProps> = ({ onClose, onDeposit }) => {
  const [amount, setAmount] = useState(100);
  const [showBonusDropdown, setShowBonusDropdown] = useState(false);
  const presetAmounts = [200, 300, 500, 750, 1000, 1500, 2500, 5000];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 100 && value <= 25000) {
      setAmount(value);
    }
  };

  const handleDeposit = () => {
    onDeposit(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cash register</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center">
          <button className="text-2xl font-bold" onClick={() => setAmount(Math.max(100, amount - 100))}>-</button>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="bg-transparent text-center text-2xl font-bold w-24"
          />
          <button className="text-2xl font-bold" onClick={() => setAmount(Math.min(25000, amount + 100))}>+</button>
        </div>
        <p className="text-gray-400 text-sm mb-4">Enter an amount from 100 to 25,000 NGN</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full py-2 px-4 text-sm"
            >
              {preset} ₴
            </button>
          ))}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center cursor-pointer" onClick={() => setShowBonusDropdown(!showBonusDropdown)}>
          <div className="flex items-center">
            <Wallet className="mr-2" />
            <span>Choose your bonus</span>
          </div>
          <ChevronDown />
        </div>
        <div className="bg-yellow-600 text-yellow-200 p-4 rounded-lg mb-4 text-sm">
          <p>WARNING! The use of CREDIT funds for gambling is prohibited from June 22, 2024, in accordance with NBU Resolution No. 72. There are also possible difficulties with replenishment for customers of the following banks: OTP bank, Pivdenny, Taskombank, Izibank, Agricole bank, Credit dnepr, Vostok. We recommend using cards from other banks.</p>
        </div>
        <button
          onClick={handleDeposit}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg"
        >
          Top up by {amount} ₴
        </button>
      </div>
    </div>
  );
};

export default DepositModal;