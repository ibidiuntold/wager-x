'use client';

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AviSelector from '../AviSelector';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUserData } from '@/hooks/useUserData'; // 🔹 new hook

const PersonalDataDrawer: React.FC = () => {
  const { currentUserData, updateUser, isLoading } = useUserData();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    phoneNumber: '',
    avatarUrl: ''
  });
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [originalNickname, setOriginalNickname] = useState('');

  useEffect(() => {
    if (currentUserData) {
      setProfile({
        id: currentUserData.id || '',
        firstName: currentUserData.firstName || '',
        lastName: currentUserData.lastName || '',
        nickname: currentUserData.nickname || '',
        email: currentUserData.email || '',
        phoneNumber: formatPhoneNumber(currentUserData.phoneNumber || ''),
        avatarUrl: currentUserData.avatarUrl || ''
      });
      setOriginalNickname(currentUserData.nickname || '');
    }
  }, [currentUserData]);

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.startsWith('234')) return cleanPhone.slice(3);
    return cleanPhone;
  };

  const checkNicknameAvailability = async (nickname: string) => {
    if (nickname.length < 3) {
      setNicknameAvailable(null);
      return;
    }

    if (nickname === originalNickname) {
      setNicknameAvailable(true);
      return;
    }

    try {
      const res = await fetch(`/api/check-nickname?nickname=${nickname}`);
      const result = await res.json();
      setNicknameAvailable(result.isAvailable);
    } catch (error) {
      console.error('Error checking nickname:', error);
      toast({
        title: "Error checking nickname",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[789]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  const handleSave = async () => {
    if (!currentUserData) return;

    setIsSaving(true);
    try {
      // ✅ Validations
      if (profile.nickname.length < 3) {
        throw new Error("Nickname must be at least 3 characters");
      }

      if (profile.nickname !== originalNickname && nicknameAvailable === false) {
        throw new Error("This nickname is already taken");
      }

      if (profile.phoneNumber && !validatePhoneNumber(profile.phoneNumber)) {
        throw new Error("Please enter a valid Nigerian phone number");
      }

      // ✅ Update via hook
      await updateUser({
        firstName: profile.firstName,
        lastName: profile.lastName,
        nickname: profile.nickname,
        phoneNumber: profile.phoneNumber ? `234${profile.phoneNumber}` : '',
        avatarUrl: profile.avatarUrl,
      });

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
        duration: 2000
      });
    } catch (saveError: any) {
      toast({
        title: "Error",
        description: saveError?.message || "Please try again",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!currentUserData) {
    return (
      <div className="text-center p-8 text-gray-500">
        Please sign in to view and edit your profile.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
        <Input
          id="firstName"
          value={profile.firstName}
          onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
          placeholder="Enter your first name"
          className="bg-gray-200 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
        />
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
        <Input
          id="lastName"
          value={profile.lastName}
          onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
          placeholder="Enter your last name"
          className="bg-gray-200 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
        />
      </div>

      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nickname</label>
        <Input
          id="nickname"
          value={profile.nickname}
          onChange={(e) => {
            setProfile(prev => ({ ...prev, nickname: e.target.value }));
            checkNicknameAvailability(e.target.value);
          }}
          placeholder="Come up with a unique nickname"
          className="bg-gray-200 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
        />
        {nicknameAvailable !== null && (
          <p className={cn("text-sm mt-1", nicknameAvailable ? "text-green-600" : "text-red-600")}>
            {nicknameAvailable ? "✓ Nickname is available" : "x Nickname is taken"}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <Input
          id="email"
          value={profile.email}
          disabled
          className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          To change your email,
          <a href="/support" className="font-semibold underline hover:text-purple-500"> contact support. </a>
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone number</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
            +234
          </span>
          <Input
            id="phone"
            value={profile.phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 10) {
                setProfile(prev => ({ ...prev, phoneNumber: value }));
              }
            }}
            placeholder="8012345678"
            maxLength={10}
            className="rounded-l-none bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
          />
        </div>
      </div>

      <AviSelector
        currentAvatarUrl={profile.avatarUrl}
        onAvatarSelect={(newUrl) => setProfile(prev => ({ ...prev, avatarUrl: newUrl }))}
      />

      <Button
        onClick={handleSave}
        variant="default"
        disabled={isSaving}
        className="w-full bg-gradient-to-tr from-purple-500 to-purple-600 hover:bg-purple-600 hover:bg-gradient-to-r"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default PersonalDataDrawer;
