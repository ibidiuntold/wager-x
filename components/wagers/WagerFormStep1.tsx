import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WagerFormValues } from './CreateWagerForm';

interface WagerFormStep1Props {
  values: WagerFormValues;
  onChange: (values: Partial<WagerFormValues>) => void;
}

export const WagerFormStep1: React.FC<WagerFormStep1Props> = ({ values, onChange }) => {
  const categories = [
    { value: 'sports', label: 'Sports' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'politics', label: 'Politics' },
    { value: 'finance', label: 'Finance' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' },
  ];

  // Set default image for all custom wagers
  React.useEffect(() => {
    if (!values.image || values.image === '/images/placeholders/wager-default.jpg') {
      onChange({ image: '/images/placeholders/custom-wager.jpg' });
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Wager Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Who will win the Premier League?"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Provide details about this wager..."
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full min-h-[120px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={values.category}
          onValueChange={(value) => onChange({ category: value })}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};