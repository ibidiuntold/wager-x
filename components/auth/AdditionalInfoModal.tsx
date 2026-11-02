'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import NicknameInput from './NicknameInput';
import DateOfBirthInput from './DateOfBirthInput';
import { validatePhoneNumber } from '@/lib/form-validators';
import { Eye, EyeOff } from 'lucide-react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

interface AdditionalInfoModalProps {
  onComplete: (data: {
    nickname: string;
    dob: string;
    phoneNumber: string;
    password: string;  // Add this
  }) => void;
  email: string;
  checkNicknameAvailability: (nickname: string) => Promise<boolean>;
}

const AdditionalInfoModal: React.FC<AdditionalInfoModalProps> = ({
  onComplete,
  email,
  checkNicknameAvailability
}) => {
  const [formData, setFormData] = useState({
    nickname: '',
    dob: '',
    phoneNumber: '',
    password: '',       
    confirmPassword: '' 
  });  

  const [errors, setErrors] = useState({
    nickname: '',
    dob: '',
    phoneNumber: '',
    password: '',       
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const requiredField = <span className="text-red-500 ml-1">*</span>;

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors = { ...errors };
    let isFormValid = true;
  
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isFormValid = false;
    }
  
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isFormValid = false;
    }
  
    // Phone number validation (optional)
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isFormValid = false;
    } else {
      newErrors.phoneNumber = '';
    }
  
    setErrors(newErrors);
    setIsValid(isFormValid && formData.nickname !== '' && formData.dob !== '' && formData.password !== '');
    return isFormValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
  try {
    const isNicknameAvailable = await checkNicknameAvailability(formData.nickname);
      if (!isNicknameAvailable) {
        setErrors(prev => ({ ...prev, nickname: 'This nickname is already taken' }));
        return;
      }
      await onComplete(formData);
    } catch (error) {
      console.error('Error saving additional info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phoneNumber: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Welcome to WagerX</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          Let's get to know you better
        </p>
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Signed in as {email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium">
          Choose a Nickname{requiredField}
        </label>
        <NicknameInput
          value={formData.nickname}
          onChange={(value, isValid) => {
            setFormData(prev => ({ ...prev, nickname: value }));
            if (value && !isValid) {  // Only show error if field has been touched
              setErrors(prev => ({ ...prev, nickname: 'Invalid nickname' }));
            } else {
              setErrors(prev => ({ ...prev, nickname: '' }));
            }
          }}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dob" className="text-sm font-medium">
          Date of Birth{requiredField}
        </label>
        <DateOfBirthInput
          value={formData.dob}
          onChange={(value, isValid) => {
            setFormData(prev => ({ ...prev, dob: value }));
            if (value && !isValid) {  // Only show error if field has been touched
              setErrors(prev => ({ ...prev, dob: 'Must be 18 or older' }));
            } else {
              setErrors(prev => ({ ...prev, dob: '' }));
            }
          }}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">You must be at least 18 years old</p>
      </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500">
              +234
            </span>
            <input
              id="phone"
              type="text"
              placeholder="8012345678"
              value={formData.phoneNumber}
              onChange={handlePhoneInput}
              className={`w-full px-3 py-2 border rounded-r-md dark:border-gray-700 dark:bg-gray-800 ${
                errors.phoneNumber ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-sm text-red-500">{errors.phoneNumber}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password{requiredField}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {formData.password && (
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password{requiredField}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !isValid}
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
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This information helps us personalize your experience
        </p>
      </div>
    </motion.div>
  );
};

export default AdditionalInfoModal;