import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Info } from 'lucide-react';
import { WagerFormValues } from './CreateWagerForm';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WagerFormStep2Props {
  values: WagerFormValues;
  onChange: (values: Partial<WagerFormValues>) => void;
}

export const WagerFormStep2: React.FC<WagerFormStep2Props> = ({ values, onChange }) => {
  const handleAddOption = () => {
    const newOptions = [...values.options, { name: `Option ${values.options.length + 1}` }];
    onChange({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (values.options.length <= 2) {
      return; // Prevent removing if only 2 options remain
    }
    const newOptions = values.options.filter((_, i) => i !== index);
    onChange({ options: newOptions });
  };

  const handleOptionChange = (index: number, name: string) => {
    const newOptions = values.options.map((option, i) => 
      i === index ? { ...option, name } : option
    );
    onChange({ options: newOptions });
  };

  return (
    <>
      <div className="w-full mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium">Wager Options <span className="text-red-500">*</span></h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add the possible outcomes for your wager. You need at least two options.
        </p>
      </div>

      <div className="w-full space-y-3 mb-4">
        {values.options.map((option, index) => (
          <div key={index} className="w-full flex items-center gap-2">
            <Input
              id={`option-${index}`}
              placeholder={`Option ${index + 1}`}
              // value={option.name}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="w-full"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOption(index)}
              disabled={values.options.length <= 2}
              className="shrink-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove option</span>
            </Button>
          </div>
        ))}


        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Odds are automatically calculated based on participation
        </div>
      </div>

      <div className="w-full flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOption}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">
                Odds are calculated as a pool system. Users bet on their chosen option, and if that option wins, 
                they receive a share of the total pot proportional to their contribution.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};