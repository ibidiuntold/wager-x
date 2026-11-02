'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BaseModal from './BaseModal';
import LoginForm from './LoginForm';
import BasicInfoStep from './MultiStepSignup/BasicInfoStep';
import AvatarStep from './MultiStepSignup/AvatarStep';
import TermsStep from './MultiStepSignup/TermsStep';
import StepTracker from './StepTracker';
import AdditionalInfoModal from './AdditionalInfoModal';
import AccountLinkingModal from './AccountLinkingModal';
import VerificationModal from './VerificationModal';
import WelcomeSuccessModal from './WelcomeSuccessModal';
import { useToast } from "@/components/ui/use-toast"
import { getAuthErrorMessage, isAuthError } from '@/lib/auth-errors';
import { GoogleSignUpData } from '@/types/auth';
import { signIn, useSession } from 'next-auth/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onSuccess?: () => void;
  referralCode?: string;
}

interface UserData {
  email: string;
  firstName?: string;
  lastName?: string;
  nickname: string;
  dob: string;
  phoneNumber?: string;
  password?: string;
  avatarUrl?: string;
  isGoogleSignIn?: boolean;
}

type StepType = 'basicInfo' | 'additionalInfo' | 'avatar' | 'terms' | null;
type ModalType = 'verification' | 'welcome' | 'linkAccount' | null;

const SIGNUP_STEPS = [
  { title: 'Account', description: 'Create account' },
  { title: 'Avatar', description: 'Choose avatar' },
  { title: 'Terms', description: 'Accept terms' }
];

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, referralCode }) => {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<StepType>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [canClose, setCanClose] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    email: '',
    nickname: '',
    dob: '',
    avatarUrl: ''
  });
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  // Move the helper functions here, before the useEffect hook
  const saveSignupProgress = (email: string, step: string) => {
    localStorage.setItem('signup_progress', JSON.stringify({
      email,
      step,
      timestamp: Date.now()
    }));
  };
  const getSignupProgress = () => {
    const progress = localStorage.getItem('signup_progress');
    if (!progress) return null;
    try {
      const data = JSON.parse(progress);
      return { email: data.email, step: data.step };
    } catch {
      localStorage.removeItem('signup_progress');
      return null;
    }
  };
  const clearSignupProgress = () => {
    localStorage.removeItem('signup_progress');
  };

  useEffect(() => {
    setMode(initialMode);
    setStep(initialMode === 'register' ? 'basicInfo' : null);
    setModalType(null);
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) {
      setUserData({
        email: '',
        nickname: '',
        dob: '',
        avatarUrl: ''
      });
      setIsLoading(false);
      setIsGoogleFlow(false);
    }
  }, [isOpen]);

  // This useEffect now has access to the functions
  useEffect(() => {
    if (isOpen) {
      const progress = getSignupProgress();
      if (progress) {
        setUserData(prev => ({ ...prev, email: progress.email }));
        setStep(progress.step as StepType);
      }
    }
  }, [isOpen]);

  // ... (rest of the component is unchanged)

  const handleClose = () => {
    if (!canClose) {
      toast({
        variant: "destructive",
        title: "Complete Your Profile",
        description: "Please complete the signup process to continue"
      });
      return;
    }
    clearSignupProgress();
    onClose();
  };

  const handleWelcomeComplete = () => {
    clearSignupProgress();
    onClose();
    window.location.href = '/dashboard';
  };

  const getCurrentStep = () => {
    switch (step) {
      case 'basicInfo':
      case 'additionalInfo':
        return 0;
      case 'avatar':
        return 1;
      case 'terms':
        return 2;
      default:
        return 0;
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setStep(newMode === 'register' ? 'basicInfo' : null);
    setModalType(null);
  };

  const handleBasicInfoComplete = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
    saveSignupProgress(data.email!, 'avatar');
    setStep('avatar');
  };

  const handleAdditionalInfoComplete = async (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
    saveSignupProgress(userData.email, 'avatar');
    setStep('avatar');
  };

  const handleAvatarComplete = (avatarUrl: string) => {
    setUserData(prev => ({ ...prev, avatarUrl }));
    saveSignupProgress(userData.email, 'terms');
    setStep('terms');
  };

  const handleTermsComplete = async () => {
    interface RequiredFields {
      email: string;
      password: string;
      nickname: string;
      dob: string;
      avatarUrl?: string;
    }
    const requiredFields: RequiredFields = {
      email: userData.email,
      password: userData.password || '',
      nickname: userData.nickname,
      dob: userData.dob,
      avatarUrl: userData.avatarUrl
    };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => {
        if (key === 'password' && isGoogleFlow) return false;
        return !value;
      })
      .map(([key]) => {
        const fieldNames: Record<string, string> = {
          email: 'Email',
          password: 'Password',
          nickname: 'Nickname',
          dob: 'Date of Birth',
          avatarUrl: 'Avatar'
        };
        return fieldNames[key];
      });
    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: `Please complete the following: ${missingFields.join(', ')}`
      });
      return;
    }
    setIsLoading(true);
    try {
      if (isGoogleFlow) {
        // Google sign up: just show welcome (user is already created by NextAuth)
        setCanClose(true);
        setModalType('welcome');
        clearSignupProgress();
      } else {
        // Regular email signup flow
        const signUpData = {
          email: userData.email,
          password: userData.password!,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          dob: userData.dob,
          nickname: userData.nickname,
          phoneNumber: userData.phoneNumber,
          avatarUrl: userData.avatarUrl || '/images/avatar/avi-1.png',
          referralCode: referralCode || undefined,
          role: 'user',
        };
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signUpData)
        });
        if (!response.ok) throw new Error('Failed to create user');
        
        setModalType('verification');

        clearSignupProgress();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to complete signup.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // NextAuth Google sign-in
      await signIn('google', { callbackUrl: '/dashboard' });
      // The rest of the flow is handled by NextAuth, so just close modal
      setIsGoogleFlow(true);
      setCanClose(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Error',
        description: error.message || 'Failed to sign in with Google.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setModalType('welcome');
  };

  const handleVerificationCloseAndSwitchToLogin = () => {
    setMode('login');
    setModalType(null);
    // onClose();
  };

  const handleAccountLinkingComplete = () => {
    onClose();
    window.location.href = '/dashboard';
  };

  const getModalContent = () => {
    if (modalType === 'linkAccount') {
      return (
        <motion.div key="link-account">
          <AccountLinkingModal
            email={userData.email}
            onClose={handleClose}
            onSuccess={handleAccountLinkingComplete}
          />
        </motion.div>
      );
    }
    if (modalType === 'verification') {
      return (
        <motion.div key="verification-form">
          <VerificationModal
            email={userData.email}
            onClose={handleClose}
            onComplete={handleVerificationComplete}
            onCloseAndSwitchToLogin={handleVerificationCloseAndSwitchToLogin}
          />
        </motion.div>
      );
    }
    if (modalType === 'welcome') {
      return (
        <motion.div key="welcome-form">
          <WelcomeSuccessModal
            nickname={userData.nickname}
            avatarUrl={userData.avatarUrl || ''}
            onClose={handleClose}
          />
        </motion.div>
      );
    }
    if (mode === 'login') {
      return (
        <motion.div key="login-form">
          <LoginForm
            onSuccess={handleClose}
            onSwitchToSignup={() => switchMode('register')}
          />
        </motion.div>
      );
    }
    switch (step) {
      case 'basicInfo':
        return (
          <motion.div key="info-form">
            <BasicInfoStep
              onComplete={handleBasicInfoComplete}
              onGoogleSignIn={handleGoogleSignIn}
              onSwitchToLogin={() => switchMode('login')}
              initialData={userData}
            />
          </motion.div>
        );
      case 'additionalInfo':
        return (
          <motion.div key="add-info-form">
            <AdditionalInfoModal
              email={userData.email}
              onComplete={handleAdditionalInfoComplete}
              checkNicknameAvailability={async (nickname: string) => {
                // Call your API to check nickname availability
                const res = await fetch(`/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
                const data = await res.json();
                return data.available;
              }}
            />
          </motion.div>
        );
      case 'avatar':
        return (
          <motion.div key="avatear-steps" >
            <AvatarStep
              onComplete={handleAvatarComplete}
              onBack={() => setStep(isGoogleFlow ? 'additionalInfo' : 'basicInfo')}
            />
          </motion.div>
        );
      case 'terms':
        return (
          <motion.div key="terms">
            <TermsStep
              onComplete={handleTermsComplete}
              onBack={() => setStep('avatar')}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    if (modalType) return '';
    if (mode === 'login') return 'Welcome Back';
    switch (step) {
      case 'basicInfo':
        return 'Create Account';
      case 'additionalInfo':
        return 'Complete Your Profile';
      case 'avatar':
        return 'Choose Your Avatar';
      case 'terms':
        return 'Terms of Service';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      showCloseButton={canClose}
      showBackButton={mode === 'register' && step !== 'basicInfo' && !modalType}
      onBack={() => {
        if (step === 'terms') setStep('avatar');
        else if (step === 'avatar') setStep(isGoogleFlow ? 'additionalInfo' : 'basicInfo');
        else if (step === 'additionalInfo') setStep('basicInfo');
      }}
    >
      {mode === 'register' && step && !modalType && (
        <StepTracker
          currentStep={getCurrentStep()}
          steps={SIGNUP_STEPS}
        />
      )}
      {getModalContent()}
    </BaseModal>
  );
};

export default AuthModal;