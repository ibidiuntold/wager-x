'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateOfBirthInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const DateOfBirthInput: React.FC<DateOfBirthInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string>('');

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 100 },
    (_, i) => (currentYear - i).toString()
  );

  useEffect(() => {
    if (value) {
      const [yearVal, monthVal, dayVal] = value.split('-');
      setYear(yearVal);
      setMonth(monthVal);
      setDay(dayVal);
    }
  }, [value]);

  const validateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const handleChange = (type: 'day' | 'month' | 'year', value: string) => {
    let newDay = type === 'day' ? value : day;
    let newMonth = type === 'month' ? value : month;
    let newYear = type === 'year' ? value : year;
  
    // Update the local state
    switch (type) {
      case 'day':
        setDay(value);
        break;
      case 'month':
        setMonth(value);
        break;
      case 'year':
        setYear(value);
        break;
    }
    if (newYear && newMonth && newDay) {
      const dateString = `${newYear}-${newMonth}-${newDay}`;
      const isValid = validateAge(dateString);
      setError(isValid ? '' : 'Must be 18 or older');
      onChange(dateString, isValid);
    } else {
      onChange('', false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-3 gap-3">
        {/* Day Dropdown */}
        <div className="relative">
          <select
            value={day}
            onChange={(e) => handleChange('day', e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 text-md border rounded-md appearance-none dark:border-gray-700 dark:bg-gray-800 pr-10 
              ${error ? 'border-red-500' : 'border-gray-300'} 
              ${disabled ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
          >
            <option value="">DD</option>
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
        </div>

        {/* Month Dropdown */}
        <div className="relative">
          <select
            value={month}
            onChange={(e) => handleChange('month', e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md appearance-none dark:border-gray-700 dark:bg-gray-800 pr-10 
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
          >
            <option value="">Month</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <select
            value={year}
            onChange={(e) => handleChange('year', e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md appearance-none dark:border-gray-700 dark:bg-gray-800 pr-10 
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
          >
            <option value="">YYYY</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default DateOfBirthInput;