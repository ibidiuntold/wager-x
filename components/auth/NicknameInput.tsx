'use client';

import React, { useState, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { validateNickname } from '@/lib/form-validators';
import debounce from 'lodash/debounce';
import { useAuth } from '@/hooks/useAuth';

interface NicknameInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const NicknameInput: React.FC<NicknameInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
 }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const { checkNicknameAvailability } = useAuth();
 
  const checkAvailability = useCallback(
    debounce(async (nickname: string) => {
      if (/[^a-zA-Z0-9_]/.test(nickname)) {
        setError('Only letters, numbers and underscore (_) are allowed');
        setIsAvailable(false);
        onChange(nickname, false); // Explicitly pass false for invalid characters
        return;
      }
   
      if (!validateNickname(nickname)) {
        setError('Nickname must be 3-20 characters');
        setIsAvailable(false);
        onChange(nickname, false); // Explicitly pass false for invalid format
        return;
      }
   
      setIsChecking(true);
      try {
        const available = await checkNicknameAvailability(nickname);
        setIsAvailable(available);
        setError(available ? '' : 'Nickname is already taken');
        onChange(nickname, available); // Pass the availability result to parent
        
        // Clear success message after 5 seconds
        if (available) {
          setTimeout(() => {
            setIsAvailable(null);
            // Don't reset the validation state when clearing the message
          }, 5000);
        }
      } catch (error) {
        setError('Error checking nickname availability');
        setIsAvailable(false);
        onChange(nickname, false); // Pass false on error
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
    onChange(newValue, false);
    checkAvailability(newValue);
   };
 
  return (
    <div className="space-y-2">
      <div className={`relative ${className}`}>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800 pr-20"
          placeholder="Choose a nickname"
          disabled={disabled}
          maxLength={20}
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
        <p className="text-xs text-green-500">Nickname is available</p>
      )}
    </div>
  );
 };

export default NicknameInput;