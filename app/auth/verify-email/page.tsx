'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'failed' | 'invalid'
  >('loading');
  const [message, setMessage] = useState('');
  const [emailToResend, setEmailToResend] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationStatus('invalid');
        setMessage('Invalid or missing token.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          setMessage(data.message);
        } else {
          setVerificationStatus('failed');
          setMessage(data.message);

          // Try to decode token to get email if expired
          try {
            const [, encodedPayload] = token.split('.');
            const decodedPayload = JSON.parse(atob(encodedPayload));
            if (decodedPayload?.email) {
              setEmailToResend(decodedPayload.email);
            }
          } catch (e) {
            console.error('Could not parse token to get email:', e);
          }
        }
      } catch (error) {
        setVerificationStatus('failed');
        setMessage('An unexpected error occurred. Please try again.');
        console.error('Client-side verification error:', error);
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async () => {
    if (!emailToResend) return;

    setResendLoading(true);
    setResendSent(false);

    try {
      const response = await fetch('/api/users/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToResend }),
      });
      const data = await response.json();
      setMessage(data.message);
      setResendSent(true);
    } catch (error) {
      setMessage('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'failed':
      case 'invalid':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'Verifying your email... Please wait.';
      case 'success':
        return '✅ Success! Your email has been verified. You can now use your account.';
      case 'failed':
        return '❌ Verification failed. The link may be expired.';
      case 'invalid':
        return '⚠️ Invalid token. Please request a new verification link.';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div
        className="bg-white p-8 rounded-xl w-full max-w-md text-center"
        style={{ boxShadow: `0 4px 20px #573EDA55` }}
      >
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo/Logo.svg"
            alt="WagerX Logo"
            width={120}
            height={120}
          />
        </div>

        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>

        <p className={`text-lg font-medium mb-6 ${getStatusColor()}`}>
          {getStatusMessage()}
        </p>

        {(verificationStatus === 'failed' || verificationStatus === 'invalid') &&
          emailToResend && (
            <button
              onClick={handleResend}
              disabled={resendLoading || resendSent}
              className={`w-full py-3 px-6 rounded-full font-semibold transition-all ${
                resendLoading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : resendSent
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {resendLoading
                ? 'Sending new link...'
                : resendSent
                ? '✅ New link sent to your email'
                : 'Resend Verification Email'}
            </button>
          )}

        <Link href="/" className="block mt-4">
          <button className="w-full py-3 px-6 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-all">
            Go to Home
          </button>
        </Link>

        <p className="mt-6 text-sm text-gray-600">
          Need help?{' '}
          <a
            href="mailto:wagerx.ng@gmail.com"
            className="text-blue-600 hover:underline"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
