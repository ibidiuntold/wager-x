'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUserData } from '@/hooks/useUserData'; // 🔹 new hook

const PasswordDrawer: React.FC = () => {
  const { currentUserData, updateUser, isLoading } = useUserData();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentUserData) {
      toast({
        title: "Error",
        description: "Please sign in to change your password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // 🔹 Call your PUT /api/users via hook
      await updateUser({ password: newPassword });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        duration: 2000,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update password",
        variant: "destructive",
        duration: 4000,
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
    <div className="space-y-4">
      {/* Current password input */}
      <div className="relative">
        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Current password
        </label>
        <div className="mt-1 relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* New password input */}
      <div className="relative">
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New password
        </label>
        <div className="mt-1 relative">
          <Input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Confirm new password input */}
      <div className="relative">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Repeat the new password
        </label>
        <div className="mt-1 relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <Button
        onClick={handleChangePassword}
        variant="default"
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Changing Password...' : 'Change Password'}
      </Button>
    </div>
  );
};

export default PasswordDrawer;
