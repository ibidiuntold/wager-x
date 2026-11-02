import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Info, AlertCircle } from 'lucide-react';
import { WagerFormValues } from './CreateWagerForm';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WagerFormStep3Props {
  values: WagerFormValues;
  onChange: (values: Partial<WagerFormValues>) => void;
}

export const WagerFormStep3: React.FC<WagerFormStep3Props> = ({ values, onChange }) => {
  // Get minimum date (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get maximum date (1 year from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const handleMinimumEntryChange = (value: string) => {
    const numValue = parseFloat(value);
    onChange({ minimumEntry: isNaN(numValue) ? 0 : numValue });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium">Wager Settings</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Configure the minimum entry amount and when your wager expires.
        </p>
      </div>
      
      <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Custom wagers are private by default. Only invited participants can join your wager.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="minimumEntry" className="flex items-center gap-2">
          Amount (Minimum Entry - ₦)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-xs">
                  This is the minimum amount a user must wager to participate.
                  Higher minimums can increase the total pool size.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400">₦</span>
          </div>
          <Input
            id="minimumEntry"
            type="number"
            // value={values.minimumEntry.toString()}
            onChange={(e) => handleMinimumEntryChange(e.target.value)}
            min={1}
            step={100}
            className="pl-8"
            placeholder={values.minimumEntry.toString()}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The minimum amount a user must wager to participate.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expirationDate" className="flex items-center gap-2">
          Expiration Date
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-xs">
                  After this date, no new bets can be placed. Choose a date that gives users enough time to participate.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="expirationDate"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !values.expiresAt && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {values.expiresAt ? (
                format(values.expiresAt, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={values.expiresAt}
              onSelect={(date) => onChange({ expiresAt: date || new Date() })}
              disabled={(date) => date < today || date > maxDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The date when this wager will be closed for new entries.
        </p>
      </div>
    </div>
  );
};