import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const sortOptions = [
  { label: "All Users", value: "all" },
  { label: "Suspended Users", value: "suspended" },
  { label: "Unverified Email", value: "unverified_email" },
  { label: "Pending KYC", value: "pending_kyc" },
  { label: "Active Users", value: "active" },
  { label: "Mobile Verified", value: "mobile_verified" },
  { label: "With Balance", value: "with_balance" },
  { label: "Without Balance", value: "without_balance" },
];

interface SortingMenuProps {
  onSortChange: (value: string) => void;
}

const SortingMenu: React.FC<SortingMenuProps> = ({ onSortChange }) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const handleSelect = (currentValue: string) => {
    setValue(currentValue === value ? "" : currentValue);
    setOpen(false);
    onSortChange(currentValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? sortOptions.find((option) => option.value === value)?.label
            : "Sort users..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search sort option..." />
          <CommandEmpty>No sort option found.</CommandEmpty>
          <CommandGroup>
            {sortOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SortingMenu;