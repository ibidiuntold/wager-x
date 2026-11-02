'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const requirements = [
    {
      text: 'At Least one Uppercase character',
      met: /[A-Z]/.test(password),
    },
    {
      text: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      text: 'Contains a number',
      met: /\d/.test(password),
    },
    {
      text: 'Contains a special character',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const getStrengthLevel = () => {
    const metCount = requirements.filter(req => req.met).length;
    if (metCount === 0) return { text: 'Weak', color: 'text-red-500' };
    if (metCount === 1) return { text: 'Fair', color: 'text-yellow-500' };
    if (metCount === 2) return { text: 'Good', color: 'text-blue-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  const strength = getStrengthLevel();

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-slate-100 px-4 py-2 dark:bg-gray-700">
      <p className={`text-xs font-medium ${strength.color}`}>
        Password Strength: {strength.text}
      </p>
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center space-x-2">
            {req.met ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-gray-500" />
            )}
            <span className={`text-xs ${req.met ? 'text-green-500' : 'text-gray-500'}`}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;