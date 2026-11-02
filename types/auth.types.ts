export const AUTH_URL_PARAMS = {
  TAB: 'tab',
  STEP: 'step',
  MODAL: 'modal',
  EMAIL: 'email'
 } as const;
 
 export const STEPS = {
  BASIC_INFO: 'basic-info',
  AVATAR: 'avatar',
  TERMS: 'terms'
 } as const;
 
 export const MODES = {
  LOGIN: 'login',
  REGISTER: 'register'
 } as const;
 
 export const MODAL_TYPES = {
  REGISTER_OAUTH: 'registerOauth',
  LINK_ACCOUNT: 'linkAccount',
  FORGOT_PASSWORD: 'forgot-password'
 } as const;
 
 export type StepValues = typeof STEPS[keyof typeof STEPS];
 export type ModeValues = typeof MODES[keyof typeof MODES];
 export type ModalTypeValues = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];
 
 export type AuthStep = StepValues | null;
 export type AuthMode = ModeValues | null;
 export type ModalType = ModalTypeValues | null;
 export type NonNullAuthStep = StepValues;
 
 export interface FirebaseAuthError extends FirebaseError {
  code: string;
  message: string;
  errors?: Array<{
    message: string;
    domain: string;
    reason: string;
  }>;
 }
 
 export interface FirebaseError {
  code: string;
  message: string;
 }
 
 export interface AuthError {
  type: 'error' | 'warning' | 'info';
  message: string;
 }
 
 export interface BasicInfoData {
  nickname: string;
  email: string;
  dob: string;
  phoneNumber?: string;
 }
 
 export interface AuthFormData {
  basicInfo?: BasicInfoData;
  avatar?: string;
  termsAccepted?: boolean;
 }
 
 export interface AuthModalState {
  step: AuthStep;
  mode: AuthMode;
  modalType: ModalType;
  formData: AuthFormData;
  email: string;
 }
 
 export interface AuthURLParams {
  tab?: string;
  step?: string;
  modal?: string;
  email?: string;
 }
 
export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

// UserProfile is canonical in types/user.types.ts — import from there
export type { UserProfile } from './user.types';