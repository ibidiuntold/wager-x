'use client';

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AviSelector from '../AviSelector';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useUserData } from '@/hooks/useUserData';
import Image from 'next/image';

interface ProfileEditFormProps {
  onSave: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onSave }) => {
  const { currentUserData, updateUser, isLoading } = useUserData();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    phoneNumber: '',
    avatarUrl: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [originalNickname, setOriginalNickname] = useState('');

  useEffect(() => {
    if (currentUserData) {
      setProfile({
        firstName: currentUserData.firstName || '',
        lastName: currentUserData.lastName || '',
        nickname: currentUserData.nickname || '',
        email: currentUserData.email || '',
        phoneNumber: formatPhoneNumber(currentUserData.phoneNumber || ''),
        avatarUrl: currentUserData.avatarUrl || '',
        street: currentUserData.address?.street || '',
        city: currentUserData.address?.city || '',
        state: currentUserData.address?.state || '',
        zip: currentUserData.address?.zip || '',
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
      if (profile.nickname.length < 3) {
        throw new Error("Nickname must be at least 3 characters");
      }
      if (profile.nickname !== originalNickname && nicknameAvailable === false) {
        throw new Error("This nickname is already taken");
      }
      if (profile.phoneNumber && !validatePhoneNumber(profile.phoneNumber)) {
        throw new Error("Please enter a valid Nigerian phone number");
      }
      await updateUser({
        firstName: profile.firstName,
        lastName: profile.lastName,
        nickname: profile.nickname,
        phoneNumber: profile.phoneNumber ? `234${profile.phoneNumber}` : '',
        avatarUrl: profile.avatarUrl,
        // address: {
        //   street: profile.street,
        //   city: profile.city,
        //   state: profile.state,
        //   zip: profile.zip,
        // }
      });
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
        duration: 2000
      });
      onSave(); // Close the edit form
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Left Side: Avatar & Documents */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-4">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
            <Image
              src={profile.avatarUrl || '/images/default-avatar.png'}
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
              VENDOR DOCUMENTS
            </Button>
          </div>
        </div>

        {/* Right Side: Form Inputs */}
        <div className="flex-1 w-full space-y-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1">First Name</label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1">Last Name</label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1">Email</label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 pb-1">Phone Number</label>
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
            {/* <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <Input
                id="address"
                value={profile.street}
                onChange={(e) => setProfile(prev => ({ ...prev, street: e.target.value }))}
                placeholder="205 N Broad St"
                className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
              />
              <div className="flex gap-2 mt-2">
                <Input
                  value={profile.city}
                  onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
                />
                <Input
                  value={profile.state}
                  onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
                />
                <Input
                  value={profile.zip}
                  onChange={(e) => setProfile(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="Zip Code"
                  className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600"
                />
              </div>
            </div> */}
          </div>
          <Button
            onClick={handleSave}
            variant="default"
            disabled={isSaving}
            className="w-full bg-gradient-to-tr from-purple-500 to-purple-600 hover:bg-purple-600 hover:bg-gradient-to-r"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditForm;