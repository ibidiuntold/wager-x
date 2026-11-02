import type { User } from '@firebase/auth';

declare global {
  interface Window {
    PaystackPop: any;
    FlutterwaveCheckout: (config: {
      public_key: string;
      tx_ref: string;
      amount: number;
      currency: string;
      payment_options: string;
      customer: {
        email: string;
        name: string;
        phone_number: string;
      };
      customizations: {
        title: string;
        description: string;
        logo: string;
      };
      callback: (response: FlutterwaveResponse) => void;
      onclose: () => void;
    }) => void;
  }
}

export interface PaymentProcessor {
  enabled: boolean;
  test: boolean;
  public_key: string;
  secret_key: string;
  logo: string;
}

export interface Settings {
  appName: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  homeTake: number;
  maxDeposit: number;
  minDeposit: number;
  minWithBalance: number;
  primaryColor: string;
  recaptchaId: string;
  registerBonus: number;
  seo: {
    description: string;
    favicon: string;
    ogImage: string;
    title: string;
  };
}

export interface Transaction {
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  status: 'success' | 'failed' | 'pending';
  provider: 'paystack' | 'manual';
  reference: string;
  bonusAwarded?: number;
  accountDetails?: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
  };
}

export interface PaystackResponse {
  reference: string;
  status: string;
  message: string;
  transaction: string;
}

export interface FlutterwaveResponse {
  transaction_id: string;
  tx_ref: string;
  flw_ref: string;
  status: string;
  message: string;
}

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata: {
    userId: string;
    email: string;
  };
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

export interface UserData {
  success: string;
  user: {
    id: string;
    walletBalance: number;
    email: string;
  }
}
