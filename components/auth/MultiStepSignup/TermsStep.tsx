'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface TermsStepProps {
  onComplete: () => Promise<void>;
  onBack: () => void;
}

const TermsStep: React.FC<TermsStepProps> = ({ onComplete, onBack }) => {
 const { toast } = useToast();
 const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
 const [isChecked, setIsChecked] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [terms, setTerms] = useState('');
 const termsRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
   const loadTerms = async () => {
     try {
       const response = await fetch('/terms.html');
       if (!response.ok) throw new Error('Failed to load terms');
       const content = await response.text();
       setTerms(content);
     } catch (error) {
       console.error('Error loading terms:', error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to load terms and conditions"
       });
     }
   };
   
   loadTerms();
 }, [toast]);

 const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
   const element = e.currentTarget;
   if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1) {
     setHasScrolledToBottom(true);
   }
 };

 const handleSubmit = async () => {
    if (!hasScrolledToBottom || !isChecked) {
      toast({
        variant: "destructive",
        title: "Incomplete Requirements",
        description: !hasScrolledToBottom 
          ? "Please read the entire terms and conditions" 
          : "Please accept the terms and conditions to continue"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await onComplete();
    } catch (error: any) {
      console.error('Error completing terms step:', error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message || "Failed to complete registration. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

 return (
   <div className="space-y-6">
     <div className="text-center space-y-2">
       <p className="text-gray-500 dark:text-gray-400">
         Please read and accept our terms to continue
       </p>
     </div>

     <div 
       ref={termsRef}
       onScroll={handleScroll}
       className="h-[400px] overflow-y-auto px-6 py-4 border rounded-lg space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 terms-content prose dark:prose-invert max-w-none"
       dangerouslySetInnerHTML={{ __html: terms }}
     />

     <div className="px-6 space-y-6">
       <div className="flex items-start space-x-3">
         <div className="relative flex items-center">
           <input
             type="checkbox"
             checked={isChecked}
             onChange={(e) => setIsChecked(e.target.checked)}
             disabled={!hasScrolledToBottom}
             className="w-5 h-5 border-2 rounded dark:bg-gray-700 dark:border-gray-600"
           />
           {isChecked && (
             <div className="absolute inset-0 flex items-center justify-center">
               <Check className="w-4 h-4 text-blue-500" />
             </div>
           )}
         </div>
         <label className={`text-sm ${!hasScrolledToBottom ? 'text-gray-400' : ''}`}>
           I have read and agree to the Terms of Service and Privacy Policy
         </label>
       </div>

       {!hasScrolledToBottom && (
         <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-center space-x-2">
           <svg
             className="w-5 h-5"
             fill="none"
             stroke="currentColor"
             viewBox="0 0 24 24"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth="2"
               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
             />
           </svg>
           <span>Please read the entire agreement before accepting</span>
         </div>
       )}

       <div className="space-y-3">
         <Button
           onClick={handleSubmit}
           disabled={!hasScrolledToBottom || !isChecked || isLoading}
           className="w-full bg-gradient-to-tr from-purple-500 to-purple-800"
         >
           {isLoading ? (
             <>
               <svg 
                 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                 xmlns="http://www.w3.org/2000/svg" 
                 fill="none" 
                 viewBox="0 0 24 24"
               >
                 <circle 
                   className="opacity-25" 
                   cx="12" 
                   cy="12" 
                   r="10" 
                   stroke="currentColor" 
                   strokeWidth="4"
                 />
                 <path 
                   className="opacity-75" 
                   fill="currentColor" 
                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                 />
               </svg>
               Processing...
             </>
           ) : (
             <>
               <Check className="w-4 h-4 mr-2" />
               Complete Registration
             </>
           )}
         </Button>

         <Button
           variant="ghost"
           onClick={onBack}
           disabled={isLoading}
           className="w-full"
         >
           Go Back
         </Button>
       </div>
     </div>
   </div>
 );
};

export default TermsStep;