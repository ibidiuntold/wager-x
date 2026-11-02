import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import CryptoJS from 'crypto-js';

const SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'wagerx-session-key';

export const useAuthSession = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  // Handle session management
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      // Set initial timestamp only once when component mounts
      if (user) {
        localStorage.setItem('last_active', Date.now().toString());
      }
      // Clean up stale data
      cleanupStaleData();
    }

    function cleanupStaleData() {
      const progress = localStorage.getItem('signup_progress');
      if (progress) {
        try {
          const data = JSON.parse(progress);
          const isStale = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
          if (isStale) {
            localStorage.removeItem('signup_progress');
          }
        } catch (error) {
          localStorage.removeItem('signup_progress');
        }
      }
    }

    function checkSession() {
      const lastActive = localStorage.getItem('last_active');
      if (lastActive && user) {
        const timeDiff = Date.now() - parseInt(lastActive);
        if (timeDiff > SESSION_TIMEOUT) {
          nextAuthSignOut({ redirect: false });
          router.push('/');
          localStorage.removeItem('last_active');
          localStorage.removeItem('signup_progress');
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden && user) {
        localStorage.setItem('last_active', Date.now().toString());
      } else {
        checkSession();
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === 'last_active' && e.newValue === null) {
        nextAuthSignOut({ redirect: false });
        router.push('/');
      }
    }

    // Only add listeners when user is logged in
    if (user) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('storage', handleStorage);
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [router, user, initialized]);

  const saveSignupProgress = (email: string, step: string) => {
    const encryptedEmail = CryptoJS.AES.encrypt(email, ENCRYPTION_KEY).toString();
    localStorage.setItem('signup_progress', JSON.stringify({
      email: encryptedEmail,
      step,
      timestamp: Date.now()
    }));
  };

  const getSignupProgress = () => {
    const progress = localStorage.getItem('signup_progress');
    if (!progress) return null;

    try {
      const data = JSON.parse(progress);
      const decryptedEmail = CryptoJS.AES.decrypt(data.email, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return {
        email: decryptedEmail,
        step: data.step
      };
    } catch (error) {
      localStorage.removeItem('signup_progress');
      return null;
    }
  };

  const clearSignupProgress = () => {
    localStorage.removeItem('signup_progress');
  };

  return {
    user,
    loading: status === 'loading',
    saveSignupProgress,
    getSignupProgress,
    clearSignupProgress
  };
};