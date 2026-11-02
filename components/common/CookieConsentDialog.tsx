'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cookie } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from '../ui/checkbox';

type ConsentStep = 'age' | 'cookies';

export default function CookieConsentDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConsentStep>('age');
  const [ageVerified, setAgeVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const consentGiven = localStorage.getItem('cookieConsent');
    const ageVerification = localStorage.getItem('ageVerified');
    
    if (!consentGiven || !ageVerification) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAgeVerification = () => {
    if (!ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm you are 18 or older.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('cookies');
  };

  const handleCookieConsent = (type: 'all' | 'essential') => {
    localStorage.setItem('cookieConsent', type);
    localStorage.setItem('ageVerified', 'true');
    
    toast({
      title: type === 'all' ? "All Cookies Accepted" : "Essential Cookies Only",
      description: "Your preferences have been saved."
    });
    
    setIsOpen(false);
  };

  const ageVerificationStep = (
    <motion.div
      key="age-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center mb-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="text-xl font-bold">Age Verification</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 px-4">
      WagerX is for users 18+ only.
      </p>
      
      <div className="flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={ageVerified}
            onCheckedChange={(checked: boolean) => setAgeVerified(checked)}
            id="age-verification"
          />
          <label 
            htmlFor="age-verification" 
            className="text-sm cursor-pointer select-none"
          >
            I confirm that I am 18 years or older
          </label>
        </div>
      </div>

      <Button 
        onClick={handleAgeVerification}
        disabled={!ageVerified}
        className="mx-auto"
      >
        Continue
      </Button>
    </motion.div>
  );

  const cookieConsentStep = (
    <motion.div
      key="cookie-step"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center mb-4">
        <Cookie className="h-12 w-12 text-purple-500" />
      </div>
      <h2 className="text-xl font-bold">Cookie Preferences</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 px-4">
        We use cookies to enhance your experience. Choose your preference.
      </p>

      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => handleCookieConsent('essential')}
        >
          Essential Only
        </Button>
        <Button
          onClick={() => handleCookieConsent('all')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Accept All
        </Button>
      </div>

      <Link 
        href="/privacy-policy" 
        className="text-xs text-gray-500 hover:underline"
      >
        Privacy Policy
      </Link>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25 }}
          >
            <AnimatePresence mode="wait">
              {currentStep === 'age' ? ageVerificationStep : cookieConsentStep}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}