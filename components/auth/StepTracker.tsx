'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepTrackerProps {
  currentStep: number;
  steps: {
    title: string;
    description: string;
  }[];
}

const StepTracker: React.FC<StepTrackerProps> = ({ currentStep, steps }) => {
  return (
    <div className="px-4 py-1">
      <div className="w-[200px] mx-auto relative">
        <div className="flex items-center justify-between relative">
          {/* Lines container */}
          <div className="absolute top-[12px] left-[16px] right-[16px] h-[1.5px] bg-gray-200 dark:bg-gray-700" />
          <div 
            className="absolute top-[12px] left-[16px] h-[1.5px] bg-purple-500 transition-all duration-300"
            style={{ 
              width: `calc(${(currentStep / (steps.length - 1)) * 100}% - ${currentStep > 0 ? '16px' : '0px'})`,
            }}
          />

          {steps.map((step, index) => (
            <div 
              key={`step-${index}-${step.title.toLowerCase().replace(/\s+/g, '-')}`}// Add unique key combining index and title
              className="flex flex-col items-center relative"
            >
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center z-10 relative
                transition-colors duration-300
                ${index < currentStep 
                  ? 'bg-purple-500' 
                  : index === currentStep 
                    ? 'border-[1.5px] border-purple-500 bg-white dark:bg-gray-800' 
                    : 'border-[1.5px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
              `}>
                {index < currentStep ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <span className={`text-xs font-medium
                    ${index === currentStep 
                      ? 'text-purple-500' 
                      : 'text-gray-400'
                    }
                  `}>
                    {index + 1}
                  </span>
                )}
              </div>
              <span className={`
                mt-1 text-xs font-medium
                ${index <= currentStep
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-400'
                }
              `}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTracker;