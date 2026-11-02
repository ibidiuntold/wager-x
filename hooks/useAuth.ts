'use client';

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';


export type UserRole = 'user' | 'admin';

type SessionUser = {
  email?: string | null;
  role?: UserRole;
  password?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  nickname?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  referralCode?: string;
  status?: string;
};

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user as SessionUser || null;
  const userRole = user?.role || null;

  /**
   * signUp - Registers a new user. Required fields:
   * email, password, firstName, lastName, dob, nickname, phoneNumber, avatarUrl, referralCode, role, status
   * The backend will set balance, walletBonus, createdAt, lastUpdated, lastLogin, emailVerified, kycVerified, gamePoints.
   */
  const signUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dob?: string;
    nickname?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    referralCode?: string;
    role?: string;
    status?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Sign up failed');
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await nextAuthSignIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (res?.error) throw new Error(res.error);
      return res;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await nextAuthSignOut({ redirect: false });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkNicknameAvailability = useCallback(async (nickname: string): Promise<boolean> => {
    const res = await fetch(`/api/users/check-availability?nickname=${encodeURIComponent(nickname)}`);
    const result = await res.json();
    return result.available;
  }, []);

  const checkEmailAvailability = useCallback(async (email: string): Promise<boolean> => {
    const res = await fetch(`/api/users/check-availability?email=${encodeURIComponent(email)}`);
    const result = await res.json();
    return result.available;
  }, []);

  // Add other user/profile update functions as needed, using /api/users

  const hasPermission = (
    requiredRole: UserRole | UserRole[],
    userRole?: UserRole
  ): boolean => {
    if (!userRole) return false;

    if (
      userRole === "admin" &&
      (Array.isArray(requiredRole)
        ? requiredRole.includes("admin") || requiredRole.includes("user")
        : requiredRole === "admin" || requiredRole === "user")
    ) {
      return true;
    }

    if (
      userRole === "user" &&
      (Array.isArray(requiredRole)
        ? requiredRole.includes("user")
        : requiredRole === "user")
    ) {
      return true;
    }

    return false;
  };

  return {
    user,
    userRole,
    isLoading: status === 'loading' || isLoading,
    error,
    signIn,
    signUp,
    logout,
    checkNicknameAvailability,
    checkEmailAvailability,
    hasPermission,
  };
}