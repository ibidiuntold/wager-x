'use client';

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import BackdropPanel from '../ui/BackdropPanel';

export interface GameSettingsConfig {
  sound?: {
    enabled: boolean;
    volume: number;
    effects: boolean;
    music: boolean;
  };
  graphics?: {
    quality: 'low' | 'medium' | 'high';
    animations: boolean;
  };
  controls?: {
    sensitivity: number;
    invertY: boolean;
    autoAim: boolean;
  };
  gameplay?: {
    difficulty: 'easy' | 'medium' | 'hard';
    tutorials: boolean;
    autoSave: boolean;
  };
  custom?: Record<string, any>; // For game-specific settings
}

const defaultSettings: GameSettingsConfig = {
  sound: {
    enabled: true,
    volume: 0.8,
    effects: true,
    music: true
  },
  graphics: {
    quality: 'medium',
    animations: true
  },
  controls: {
    sensitivity: 0.5,
    invertY: false,
    autoAim: false
  },
  gameplay: {
    difficulty: 'medium',
    tutorials: true,
    autoSave: true
  }
};

interface GameSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: Partial<GameSettingsConfig>;
  onSettingsChange: (settings: GameSettingsConfig) => void;
  gameSpecificSettings?: {
    section: string;
    settings: Array<{
      key: string;
      label: string;
      type: 'toggle' | 'slider' | 'select';
      options?: Array<{ value: string; label: string }>;
      defaultValue: any;
    }>;
  };
  className?: string;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  isOpen,
  onClose,
  initialSettings,
  onSettingsChange,
  gameSpecificSettings,
  className
}) => {
  const [settings, setSettings] = useState<GameSettingsConfig>({
    ...defaultSettings,
    ...initialSettings
  });

  const handleSettingChange = (
    section: keyof GameSettingsConfig,
    setting: string,
    value: any
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [setting]: value
      }
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/50 backdrop-blur-sm",
      className
    )}>
      <BackdropPanel className="w-full max-w-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sound Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Sound</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Master Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sound?.volume}
                onChange={(e) => handleSettingChange('sound', 'volume', parseFloat(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Sound Effects</span>
              <button
                onClick={() => handleSettingChange('sound', 'effects', !settings.sound?.effects)}
                className={cn(
                  "px-3 py-1 rounded",
                  settings.sound?.effects ? "bg-white/20" : "bg-white/5"
                )}
              >
                {settings.sound?.effects ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Music</span>
              <button
                onClick={() => handleSettingChange('sound', 'music', !settings.sound?.music)}
                className={cn(
                  "px-3 py-1 rounded",
                  settings.sound?.music ? "bg-white/20" : "bg-white/5"
                )}
              >
                {settings.sound?.music ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Graphics Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Graphics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Quality</span>
              <select
                value={settings.graphics?.quality}
                onChange={(e) => handleSettingChange('graphics', 'quality', e.target.value)}
                className="bg-white/10 text-white px-3 py-1 rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Animations</span>
              <button
                onClick={() => handleSettingChange('graphics', 'animations', !settings.graphics?.animations)}
                className={cn(
                  "px-3 py-1 rounded",
                  settings.graphics?.animations ? "bg-white/20" : "bg-white/5"
                )}
              >
                {settings.graphics?.animations ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Game-specific Settings */}
        {gameSpecificSettings && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{gameSpecificSettings.section}</h3>
            <div className="space-y-3">
              {gameSpecificSettings.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <span className="text-white/80">{setting.label}</span>
                  {setting.type === 'toggle' && (
                    <button
                      onClick={() => handleSettingChange('custom', setting.key, !settings.custom?.[setting.key])}
                      className={cn(
                        "px-3 py-1 rounded",
                        settings.custom?.[setting.key] ? "bg-white/20" : "bg-white/5"
                      )}
                    >
                      {settings.custom?.[setting.key] ? 'On' : 'Off'}
                    </button>
                  )}
                  {setting.type === 'slider' && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.custom?.[setting.key]}
                      onChange={(e) => handleSettingChange('custom', setting.key, parseFloat(e.target.value))}
                      className="w-32"
                    />
                  )}
                  {setting.type === 'select' && setting.options && (
                    <select
                      value={settings.custom?.[setting.key]}
                      onChange={(e) => handleSettingChange('custom', setting.key, e.target.value)}
                      className="bg-white/10 text-white px-3 py-1 rounded"
                    >
                      {setting.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </BackdropPanel>
    </div>
  );
};

export default GameSettings;
