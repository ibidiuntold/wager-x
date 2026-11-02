'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { WagerFormStep1 } from './WagerFormStep1';
import { WagerFormStep2 } from './WagerFormStep2';
import { WagerFormStep3 } from './WagerFormStep3';
import { Steps } from '../ui/steps';
import WagerSuccessDialog from './WagerSuccessDialog';
import { signIn, useSession } from 'next-auth/react';
import { useWagerCreator } from '@/hooks/useWagerCreator';

export interface WagerFormValues {
  title: string;
  description: string;
  category: string;
  image: string;
  options: { name: string }[];
  minimumEntry: number;
  expiresAt: Date;
  isPublic: boolean;
  status: string;
  creatorId?: string;
}

export const CreateWagerForm: React.FC = ( {categoryData}: {categoryData?: string | null} ) => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdWager, setCreatedWager] = useState<{ id: string; slug: string } | null>(null);
  const { data: session } = useSession();
  const { createWager } = useWagerCreator();

  const [formValues, setFormValues] = useState<WagerFormValues>({
    title: '',
    description: '',
    category: categoryData || 'sports',
    image: '/images/placeholders/wager-default.jpg',
    options: [{ name: 'Option 1' }, { name: 'Option 2' }],
    minimumEntry: 500,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isPublic: true,
    status: 'open',
    creatorId: session?.user?.id || '',
  });

  const updateFormValues = (values: Partial<WagerFormValues>) => {
    setFormValues((prev) => ({ ...prev, ...values }));
  };

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createWager(formValues);

      if (result.success && result.wagerId && result.wagerSlug) {
        setCreatedWager({ id: result.wagerId, slug: result.wagerSlug });
        toast({
          title: 'Wager Created Successfully',
          description: 'Your custom wager has been published!',
        });
        setShowSuccessDialog(true);
      } else {
        throw new Error(result.error || 'Failed to create wager');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Create Wager',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WagerFormStep1 values={formValues} onChange={updateFormValues} categoryData={categoryData} />;
      case 2:
        return <WagerFormStep2 values={formValues} onChange={updateFormValues} />;
      case 3:
        return <WagerFormStep3 values={formValues} onChange={updateFormValues} />;
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (isSubmitting) return true;
    switch (currentStep) {
      case 1:
        return !formValues.title || !formValues.description;
      case 2:
        return formValues.options.length < 2 || formValues.options.some((opt) => !opt.name);
      case 3:
        return formValues.minimumEntry <= 0;
      default:
        return false;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return 'Basic Info';
      case 2:
        return 'Options';
      case 3:
        return 'Settings';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-8">
      <Steps currentStep={currentStep} totalSteps={3} renderTitle={getStepTitle} />

      <div className="mt-8 p-4 border rounded-lg dark:border-gray-700">
        {renderStepContent()}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>
          Back
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext} disabled={isNextDisabled()}>
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isNextDisabled()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              'Create Wager'
            )}
          </Button>
        )}
      </div>

      {createdWager && (
        <WagerSuccessDialog
          isOpen={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          wagerId={createdWager.id}
          wagerSlug={createdWager.slug}
          wagerTitle={formValues.title}
        />
      )}
    </div>
  );
};
