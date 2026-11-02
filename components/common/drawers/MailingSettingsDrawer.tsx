'use client';

import React, { useState, useEffect } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { useToast } from "@/components/ui/use-toast";
import { useNotification } from '@/contexts/NotificationContext';

interface MailingSettings {
  systemMessages: boolean;
  personalBonuses: boolean; 
  smsDistribution: boolean;
  pushNotifications: boolean;
}

export default function MailingSettingsDrawer({ userId }) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { requestPushPermission, isPushEnabled } = useNotification();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/users/mailing-settings?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || null);
        } else {
          setError('Failed to fetch mailing settings');
        }
      } catch (err) {
        setError('Failed to fetch mailing settings');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchSettings();
  }, [userId]);

  const handleSettingChange = async (setting: keyof MailingSettings, value: boolean) => {
    // Special handling for push notifications - request permission if turning on
    if (setting === 'pushNotifications' && value && !isPushEnabled) {
      try {
        const granted = await requestPushPermission();
        if (!granted) {
          // Permission denied - don't update the setting
          toast({
            title: "Permission Denied",
            description: "Push notifications need browser permission to work",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Error requesting push notification permission:', error);
        toast({
          title: "Error",
          description: "Couldn't enable push notifications",
          variant: "destructive"
        });
        return;
      }
    }

    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch('/api/users/mailing-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, settings }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
        duration: 2000
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!settings) {
    return <div>No settings found for this user.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SwitchItem
          label="System messages"
          description="Important updates about your account and platform changes"
          checked={settings.systemMessages}
          onChange={() => handleSettingChange('systemMessages', !settings.systemMessages)}
        />

        <SwitchItem
          label="Personal bonuses by email"
          description="Get notified about special offers and personal bonuses"
          checked={settings.personalBonuses}
          onChange={() => handleSettingChange('personalBonuses', !settings.personalBonuses)}
        />

        <SwitchItem
          label="SMS-distribution"
          description="Receive important updates via SMS"
          checked={settings.smsDistribution}
          onChange={() => handleSettingChange('smsDistribution', !settings.smsDistribution)}
        />

        <SwitchItem
          label="Push notifications"
          description="Get instant notifications in your browser"
          checked={settings.pushNotifications}
          onChange={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
        />
      </div>

      <Button 
        onClick={handleSave} 
        variant="default"
        className="w-full"
      >
        Save Changes
      </Button>
    </div>
  );
}

interface SwitchItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const SwitchItem: React.FC<SwitchItemProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {description}
      </div>
    </div>
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      className="w-[42px] h-[25px] bg-gray-200 rounded-full relative data-[state=checked]:bg-purple-600 outline-none cursor-default dark:bg-gray-700"
    >
      <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
    </Switch.Root>
  </div>
);