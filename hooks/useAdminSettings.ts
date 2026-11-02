// hooks/useAdminSettings.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { cacheService } from '@/services/cacheService';
import { AdminSettings, AdminSettingsFormData, DEFAULT_SETTINGS } from '@/types/adminSettings';
import { deepMerge } from '@/lib/utils'; // Assuming this helper is in a utility file

// Settings cache keys
const SETTINGS_CACHE_KEY = 'admin_settings';
const SETTINGS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  const fetchSettings = useCallback(async (skipCache = false) => {
    try {
      if (!skipCache) {
        const cachedSettings = cacheService.get<AdminSettings>(SETTINGS_CACHE_KEY, SETTINGS_CACHE_DURATION);
        if (cachedSettings) {
          setSettings(cachedSettings);
          setIsLoading(false);
          return;
        }
      }
      
      if (cacheService.isPending(SETTINGS_CACHE_KEY)) return;
      
      cacheService.setPending(SETTINGS_CACHE_KEY);
      setIsLoading(true);
      
      const res = await fetch('/api/admin/settings');
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch settings');
      }
      
      setSettings(result.settings);
      cacheService.set(SETTINGS_CACHE_KEY, result.settings);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch settings'));
    } finally {
      setIsLoading(false);
      cacheService.clearPending(SETTINGS_CACHE_KEY);
    }
  }, [toast]);

  // Convert AdminSettings to form data format
  const getFormData = useCallback((): AdminSettingsFormData => {
    // Your existing getFormData implementation
  }, [settings]);

  // Convert form data to AdminSettings format
  const formDataToSettings = useCallback((formData: AdminSettingsFormData): AdminSettings => {
    // Your existing formDataToSettings implementation
  }, [settings]);

  const saveSettings = useCallback(async (formData: AdminSettingsFormData): Promise<boolean> => {
    try {
      setIsSaving(true);
      
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to save settings');
      }
      
      setSettings(result.settings);
      cacheService.set(SETTINGS_CACHE_KEY, result.settings);
      
      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully.',
      });
      
      return true;
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    isSaving,
    fetchSettings: () => fetchSettings(true),
    saveSettings,
    getFormData,
  };
}