'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, ChevronLeft } from 'lucide-react';

interface TermsAgreementStepProps {
  onComplete: () => void;
  onBack: () => void;
}

const TermsAgreementStep: React.FC<TermsAgreementStepProps> = ({
  onComplete,
  onBack,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = Math.abs(
      element.scrollHeight - element.scrollTop - element.clientHeight
    ) < 1;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleSubmit = () => {
    if (hasScrolledToBottom && isChecked) {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold flex-1">Terms of Service</h2>
      </div>

      <div 
        ref={termsRef}
        onScroll={handleScroll}
        className="prose dark:prose-invert max-h-[400px] overflow-y-auto border rounded-md p-4 text-sm"
      >
        <h3>Terms and Conditions</h3>
        <p>Please read these terms and conditions carefully before using our service.</p>
        
        {/* Add your terms content here */}
        <h4>1. Introduction</h4>
        <p>Welcome to WagerX. By using our platform, you agree to these terms...</p>

        <h4>2. Definitions</h4>
        <p>In these Terms of Service, the following definitions apply...</p>

        <h4>3. Account Registration</h4>
        <p>When you create an account with us, you guarantee that...</p>

        <h4>4. User Responsibilities</h4>
        <p>You are responsible for maintaining the confidentiality of your account...</p>

        <h4>5. Betting Rules</h4>
        <p>All bets placed on our platform are subject to...</p>

        <h4>6. Deposits and Withdrawals</h4>
        <p>Users can deposit and withdraw funds according to...</p>

        <h4>7. Privacy Policy</h4>
        <p>Your privacy is important to us. We handle your data according to...</p>

        <h4>8. Termination</h4>
        <p>We reserve the right to terminate accounts that violate these terms...</p>

        <h4>9. Limitation of Liability</h4>
        <p>Our liability is limited to...</p>

        <h4>10. Changes to Terms</h4>
        <p>We may update these terms from time to time...</p>
      </div>

      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          disabled={!hasScrolledToBottom}
          className="rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800"
        />
        <span className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : ''}`}>
          I have read and agree to the Terms of Service
        </span>
      </label>

      {!hasScrolledToBottom && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Please read the entire agreement before accepting
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!hasScrolledToBottom || !isChecked}
        className="w-full"
      >
        {hasScrolledToBottom && isChecked ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Accept and Continue
          </>
        ) : (
          'Accept and Continue'
        )}
      </Button>
    </motion.div>
  );
};

export default TermsAgreementStep;