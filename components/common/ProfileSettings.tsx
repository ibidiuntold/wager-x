'use client'

import React, { useState } from 'react';
import { LogOut, User, Mail, Phone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import LayoutSelector from './LayoutSelector';
import { useAuthActions } from '@/hooks/useAuthActions';
import ProfileEditForm from './drawers/ProfileEditForm';
import PasswordChangeForm from './drawers/PasswordChangeForm';
import { useUserData } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import FriendshipButton from '@/components/friends/FriendshipButton';

const ProfileSettings: React.FC = () => {
  const { signOut } = useAuthActions();
  const { currentUserData, isLoading } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const searchParams = useSearchParams();
  const viewingUserId = searchParams.get('userId'); // non-null when viewing another user's profile

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!currentUserData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to access settings</p>
      </div>
    );
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const { firstName, lastName, email, phoneNumber, avatarUrl, balance, walletBonus, nickname } = currentUserData;
  const totalBalance = (Number(balance) || 0) + (Number(walletBonus) || 0);
  const formattedBalance = `₦${totalBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // const fullAddress = `${currentUserData.address?.street || ''}, ${currentUserData.address?.city || ''}, ${currentUserData.address?.state || ''}, ${currentUserData.address?.zip || ''}, ${currentUserData.address?.country || 'USA'}`.trim();

  return (
    <LayoutSelector layoutType="main">
      <section className="px-4 py-12 mt-8 min-h-[70vh] flex justify-center items-center">
        <div className="w-full max-w-[800px] mx-auto p-4 md:p-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
            <div className="flex items-center gap-2">
              {viewingUserId && viewingUserId !== (currentUserData as any)?.id && (
                <FriendshipButton profileUserId={viewingUserId} />
              )}
              {!viewingUserId && (
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  className={cn("text-purple-600 dark:text-purple-400", isEditing ? 'bg-purple-500 text-white' : '')}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="w-full">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Left Side: Avatar & Documents */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-4">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                    <Image
                      src={avatarUrl || '/images/default-avatar.png'}
                      alt="User Avatar"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="text-sm font-normal py-2 px-4 border border-gray-300 dark:border-gray-600">
                      LOGO
                    </Button>
                    <Button variant="outline" className="text-sm font-normal py-2 px-4 border border-gray-300 dark:border-gray-600">
                      CHANGE IMAGE
                    </Button>
                  </div>
                </div>

                {/* Right Side: User Data */}
                <div className="flex-1 space-y-4 text-gray-700 dark:text-gray-300 self-start md:ps-5">
                  {/* Name */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="font-semibold block text-gray-900 dark:text-gray-100">Name:</span>
                      <p className="text-gray-700 dark:text-gray-300">{firstName} {lastName}</p>
                    </div>
                  </div>

                  {/* Nickname */}
                  {nickname && (
                    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                      <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <span className="font-semibold block text-gray-900 dark:text-gray-100">Nickname:</span>
                        <p className="text-gray-700 dark:text-gray-300">@{nickname}</p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                    <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="font-semibold block text-gray-900 dark:text-gray-100">Email:</span>
                      <p className="text-gray-700 dark:text-gray-300">{email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                    <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="font-semibold block text-gray-900 dark:text-gray-100">Phone Number:</span>
                      <p className="text-gray-700 dark:text-gray-300">{phoneNumber || '—'}</p>
                    </div>
                  </div>

                  {/* Wallet Balance */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
                    <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="font-semibold block text-gray-900 dark:text-gray-100">Wallet Balance:</span>
                      <p className="text-purple-600 dark:text-purple-400 font-semibold">{formattedBalance}</p>
                      {Number(walletBonus) > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Includes ₦{Number(walletBonus).toLocaleString('en-NG', { minimumFractionDigits: 2 })} bonus
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ProfileEditForm onSave={() => setIsEditing(false)} />
          )}

          <div className="mt-12 space-y-8">
            <PasswordChangeForm />
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              variant="outline"
              className="w-full md:w-auto text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
              onClick={signOut}
            >
              Sign out of the account
              <LogOut className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </LayoutSelector>
  );
};

export default ProfileSettings;