import React, { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import banks from '@/components/banks.json';

interface Bank {
  name: string;
  slug: string;
  code: string;
  ussd: string;
  image: string;
}

interface BankSelectorProps {
  selectedBank: string;
  setSelectedBank: (value: string) => void;
}

const BankSelector: React.FC<BankSelectorProps> = ({ selectedBank, setSelectedBank }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const typedBanks = banks as Bank[];

  const filteredBanks = useMemo(() => {
    return typedBanks.filter((bank: Bank) => 
      bank.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm('');
    }
  };

  const EmptyState = () => (
    <Select.Item value="empty" className="p-2 text-gray-500 dark:text-gray-400 text-center cursor-default">
      <Select.ItemText>No banks found</Select.ItemText>
    </Select.Item>
  );

  return (
    <div className="relative">
      <Select.Root 
        value={selectedBank} 
        onValueChange={(value) => {
          if (value !== 'empty') {
            setSelectedBank(value);
          }
        }}
        onOpenChange={handleOpenChange}
        open={isOpen}
      >
        <Select.Trigger className="w-full flex items-center justify-between bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2">
          <Select.Value placeholder="Select a bank" />
          <Select.Icon>
            <ChevronDown className="h-4 w-4" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content 
            className="bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 min-w-[200px]"
            position="popper"
            sideOffset={5}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-2">
                <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search banks..."
                  className="bg-transparent outline-none w-full text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <Select.Viewport className="p-2 max-h-[200px] overflow-y-auto">
              <Select.Group>
                {filteredBanks.length > 0 ? (
                  filteredBanks.map((bank) => (
                    <Select.Item
                      key={bank.code}
                      value={bank.code}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md"
                    >
                      <div className="flex items-center w-full">
                        <img src={bank.image} alt={bank.name} className="h-6 w-6 mr-2" />
                        <Select.ItemText>{bank.name}</Select.ItemText>
                      </div>
                    </Select.Item>
                  ))
                ) : (
                  <EmptyState />
                )}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default BankSelector;