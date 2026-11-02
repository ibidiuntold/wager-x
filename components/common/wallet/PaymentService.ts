// components/common/wallet/PaymentService.ts
import { PaystackConfig, PaystackResponse, FlutterwaveResponse, PaymentProcessor } from './types';
import { useSession } from 'next-auth/react';

const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.PaystackPop !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.body.appendChild(script);
  });
};

const loadFlutterwaveScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.FlutterwaveCheckout !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
    document.body.appendChild(script);
  });
};

export class PaymentService {
  private processors: Record<string, PaymentProcessor>;

  constructor() {
    this.processors = {
      paystack: {
        enabled: process.env.NEXT_PUBLIC_PAYSTACK_ENABLE === 'true',
        test: process.env.NEXT_PUBLIC_PAYSTACK_TEST_MODE === 'true',
        public_key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        secret_key: '',
        logo: '/images/logo/paystack.png'
      },
      flutterwave: {
        enabled: process.env.NEXT_PUBLIC_FLUTTERWAVE_ENABLE === 'true',
        test: process.env.NEXT_PUBLIC_FLUTTERWAVE_TEST_MODE === 'true',
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
        secret_key: '',
        logo: '/images/logo/flutterwave.png'
      }
    };
  }

  getEnabledProcessors(): Record<string, PaymentProcessor> {
    return Object.entries(this.processors)
      .filter(([_, processor]) => processor.enabled)
      .reduce((acc, [id, processor]) => ({
        ...acc,
        [id]: processor
      }), {});
  }

  // NOTE: This method is now redundant because the frontend handles the payment initialization using react-paystack.
  // We'll keep it as a placeholder for other processors if needed.
  async initializePayment() {
    console.warn("initializePayment method is not used directly for Paystack with react-paystack component.");
    throw new Error("This method is deprecated for the current implementation.");
  }

  async verifyPayment(reference: string, userId: string, processorId: string): Promise<any> {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, userId, processorId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      return result;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }
}