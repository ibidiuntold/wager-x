export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Validates 10-digit Nigerian phone number
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  requirements: {
    hasMinLength: boolean;
    hasNumber: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasSpecialChar: boolean;
  };
} => {
  const requirements = {
    hasMinLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return {
    isValid: Object.values(requirements).every(Boolean),
    requirements,
  };
};

export const validateNickname = (nickname: string): boolean => {
  // Alphanumeric (case-insensitive) with underscores and hyphens, 3-20 characters
  const nicknameRegex = /^[a-z0-9_-]{3,20}$/i;
  return nicknameRegex.test(nickname);
};

export const validateName = (name: string): boolean => {
  // 2-50 characters, letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name);
};

export const validateAge = (dob: string): boolean => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 18;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

  const strengthMap = {
    0: { label: 'Very Weak', color: 'text-red-500' },
    1: { label: 'Weak', color: 'text-orange-500' },
    2: { label: 'Fair', color: 'text-yellow-500' },
    3: { label: 'Good', color: 'text-blue-500' },
    4: { label: 'Strong', color: 'text-green-500' },
    5: { label: 'Very Strong', color: 'text-green-600' },
  };

  return {
    score,
    ...strengthMap[score as keyof typeof strengthMap],
  };
};

export const validateForm = (fields: Record<string, any>): boolean => {
  return Object.values(fields).every(value => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  });
};

export const generateNickname = (firstName: string, lastName: string): string => {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${cleanFirstName}${cleanLastName}${random}`;
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(0, 10);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = sanitizePhoneNumber(phone);
  return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};