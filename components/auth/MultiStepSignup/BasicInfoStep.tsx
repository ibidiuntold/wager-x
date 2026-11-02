'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import GoogleIcon from '@/components/icons/GoogleIcon';
import NicknameInput from '../NicknameInput';
import EmailInput from '../EmailInput';
import DateOfBirthInput from '../DateOfBirthInput';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';
import { validateEmail, validatePassword, validatePhoneNumber } from '@/lib/form-validators';

interface BasicInfoStepProps {
  onComplete: (data: {
    nickname: string;
    email: string;
    dob: string;
    phoneNumber?: string;
    password: string;
  }) => void;
  onGoogleSignIn: () => void;
  onSwitchToLogin?: () => void;
  initialData?: {
    nickname?: string;
    email?: string;
    dob?: string;
    phoneNumber?: string;
  };
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  onComplete,
  onGoogleSignIn,
  onSwitchToLogin,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    nickname: initialData.nickname || '',
    email: initialData.email || '',
    dob: initialData.dob || '',
    phoneNumber: initialData.phoneNumber || '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    nickname: '',
    email: '',
    dob: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailValidated, setEmailValidated] = useState(false);
  const [nicknameValidated, setNicknameValidated] = useState(false);

  useEffect(() => {
    const { isValid } = validatePassword(formData.password);
    setIsPasswordValid(isValid);
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;
  
    // Check if both validations are complete
    if (!emailValidated || !nicknameValidated) {
      setError('Please wait for email and nickname validation to complete');
      return false;
    }
  
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
      isValid = false;
    }  
  
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }
  
    const { isValid: isPasswordValid } = validatePassword(formData.password);
    if (!isPasswordValid) {
      newErrors.password = 'Password does not meet requirements';
      isValid = false;
    }
  
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
  
    setErrors(newErrors);
    return isValid;
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onComplete(formData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, password: value }));
    if (!showPasswordRequirements) {
      setShowPasswordRequirements(true);
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

      {error && (
        <div className="p-3 text-xs text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">

      <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs text-gray-500 dark:text-gray-500 font-medium">Email</label>
        <span className="text-xs text-red-400"> *</span>
        <EmailInput
          value={formData.email}
          onChange={(value, isValid) => {
            setFormData(prev => ({ ...prev, email: value }));
            setErrors(prev => ({ ...prev, email: isValid ? '' : 'Invalid or unavailable email' }));
            setEmailValidated(isValid); // This will now properly update based on validation
          }}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="nickname" className="text-xs text-gray-500 dark:text-gray-500 font-medium">Choose a Nickname</label>
        <span className="text-xs text-red-400"> *</span>
        <NicknameInput
          value={formData.nickname}
          onChange={(value, isValid) => {
            setFormData(prev => ({ ...prev, nickname: value }));
            setErrors(prev => ({ ...prev, nickname: isValid ? '' : 'Invalid or unavailable nickname' }));
            setNicknameValidated(isValid); // This will now properly update based on validation
          }}
          disabled={isLoading}
        />
      </div>
      </div>

        <div className="space-y-2">
          <label htmlFor="dob" className="text-xs text-gray-500 dark:text-gray-500 font-medium">Date of Birth</label>
          <span className="text-xs text-gray-400 dark:text-gray-600"> (Must be at least 18)</span>
          <span className="text-xs text-red-400"> *</span>
          <DateOfBirthInput
            value={formData.dob}
            onChange={(value, isValid) => {
              setFormData(prev => ({ ...prev, dob: value }));
              setErrors(prev => ({ ...prev, dob: isValid ? '' : 'Must be 18 or older' }));
            }}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-xs text-gray-500 dark:text-gray-500 font-medium">
            Phone Number <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500">
              +234
            </span>
            <input
              id="phone"
              type="text"
              value={formData.phoneNumber}
              onChange={handlePhoneInput}
              placeholder="8012345678"
              className="w-full px-3 py-2 border rounded-r-md dark:border-gray-700 dark:bg-gray-800"
              disabled={isLoading}
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-xs text-red-500">{errors.phoneNumber}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs text-gray-500 dark:text-gray-500 font-medium">Password</label>
          <span className="text-xs text-red-400"> *</span>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {showPasswordRequirements && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {isPasswordValid && (
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-xs text-gray-500 dark:text-gray-500 font-medium">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-tr from-purple-500 to-purple-800" 
          disabled={isLoading || !emailValidated || !nicknameValidated}
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
              Hmmm...
            </>
          ) : (
            'Continue'
          )}
        </Button>

        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div> */}

{/* Add Goodle Sign Up later */}
        {/* <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onGoogleSignIn}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          Continue with Google
        </Button> */}

        <div className="text-center text-xs">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Login
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default BasicInfoStep;