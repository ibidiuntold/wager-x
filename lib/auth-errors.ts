import { FirebaseError, AuthError } from '../types/auth.types';


export const AUTH_ERROR_CODES = {
  // Sign-up errors
  EMAIL_EXISTS: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  
  // Sign-in errors
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  INVALID_LOGIN_CREDENTIAL: 'auth/invalid-login-credential',
  
  // Account linking errors
  CREDENTIAL_EXISTS: 'auth/credential-already-in-use',
  EMAIL_EXISTS_DIFFERENT_CREDENTIAL: 'auth/account-exists-with-different-credential',
  
  // General errors
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  POPUP_CLOSED: 'auth/popup-closed-by-user',
  CANCELLED: 'auth/cancelled-popup-request',
  USER_DISABLED: 'auth/user-disabled',
  NETWORK_ERROR: 'auth/network-request-failed'
} as const;

export const getAuthErrorMessage = (error: FirebaseError): AuthError => {
  const errorMap: Record<string, AuthError> = {
    [AUTH_ERROR_CODES.EMAIL_EXISTS]: {
      type: 'error',
      message: 'An account already exists with this email address.'
    },
    [AUTH_ERROR_CODES.INVALID_EMAIL]: {
      type: 'error',
      message: 'Please enter a valid email address.'
    },
    [AUTH_ERROR_CODES.WEAK_PASSWORD]: {
      type: 'warning',
      message: 'Password should be at least 8 characters long with a mix of letters, numbers, and symbols.'
    },
    [AUTH_ERROR_CODES.USER_NOT_FOUND]: {
      type: 'error',
      message: 'No account found with this email address.'
    },
    [AUTH_ERROR_CODES.WRONG_PASSWORD]: {
      type: 'error',
      message: 'Incorrect password. Please try again.'
    },
    [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: {
      type: 'error',
      message: 'Too many unsuccessful attempts. Please try again later.'
    },
    [AUTH_ERROR_CODES.INVALID_LOGIN_CREDENTIAL]: {
      type: 'error',
      message: 'Your login credential are invalid. Please try again.'
    },
    [AUTH_ERROR_CODES.CREDENTIAL_EXISTS]: {
      type: 'info',
      message: 'This account is already linked to another provider.'
    },
    [AUTH_ERROR_CODES.EMAIL_EXISTS_DIFFERENT_CREDENTIAL]: {
      type: 'info',
      message: 'An account already exists with this email. Try signing in with a different method.'
    },
    [AUTH_ERROR_CODES.OPERATION_NOT_ALLOWED]: {
      type: 'error',
      message: 'This operation is not allowed.'
    },
    [AUTH_ERROR_CODES.POPUP_CLOSED]: {
      type: 'info',
      message: 'The sign-in popup was closed before completion.'
    },
    [AUTH_ERROR_CODES.CANCELLED]: {
      type: 'info',
      message: 'Sign-in was cancelled.'
    },
    [AUTH_ERROR_CODES.USER_DISABLED]: {
      type: 'error',
      message: 'This account has been disabled. Please contact support.'
    },
    [AUTH_ERROR_CODES.NETWORK_ERROR]: {
      type: 'error',
      message: 'A network error occurred. Please check your connection and try again.'
    }
  };

  return errorMap[error.code] || {
    type: 'error',
    message: 'Ouch!. Please try again.'
  };
};

export const isAuthError = (error: any): error is FirebaseError => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
}; 