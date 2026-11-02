'use client';

import React, { useState, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { validateEmail } from '@/lib/form-validators';
import debounce from 'lodash/debounce';
import { useAuth } from '@/hooks/useAuth';

interface EmailInputProps {
 value: string;
 onChange: (value: string, isValid: boolean) => void;
 disabled?: boolean;
 className?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({
 value,
 onChange,
 disabled = false,
 className = ''
}) => {
 const [isChecking, setIsChecking] = useState(false);
 const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
 const [error, setError] = useState<string>('');
 const { checkEmailAvailability } = useAuth();

 const checkAvailability = useCallback(
    debounce(async (email: string) => {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setIsAvailable(false);
        onChange(email, false); // Explicitly pass false for invalid email
        return;
      }
  
      setIsChecking(true);
      try {
        const available = await checkEmailAvailability(email);
        setIsAvailable(available);
        setError(available ? '' : 'Email is already in use');
        onChange(email, available); // Pass the availability result to parent
        
        // Clear success message after 5 seconds
        if (available) {
          setTimeout(() => {
            setIsAvailable(null);
            // Don't reset the validation state when clearing the message
          }, 5000);
        }
      } catch (error) {
        setError('Error checking email availability');
        setIsAvailable(false);
        onChange(email, false); // Pass false on error
      } finally {
        setIsChecking(false);
      }
    }, 10000),
    []
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsAvailable(null);
    setError('');
    onChange(newValue, false); // Reset validation state on new input
    checkAvailability(newValue);
  };

 return (
   <div className="space-y-2">
     <div className={`relative ${className}`}>
       <input
         type="email"
         value={value}
         onChange={handleInputChange}
         className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800 pr-20"
         placeholder="me@wagerx.ng"
         disabled={disabled}
       />
       <div className="absolute inset-y-0 right-0 flex items-center pr-3">
         {isChecking ? (
           <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
         ) : isAvailable ? (
           <Check className="h-5 w-5 text-green-500" />
         ) : error ? (
           <X className="h-5 w-5 text-red-500" />
         ) : null}
       </div>
     </div>
     {error && (
       <p className="text-xs text-red-500">{error}</p>
     )}
     {isAvailable && !error && (
       <p className="text-xs text-green-500">Email is available</p>
     )}
   </div>
 );
};

export default EmailInput;