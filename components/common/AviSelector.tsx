'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AviSelectorProps {
  currentAvatarUrl: string;
  onAvatarSelect: (avatarUrl: string) => void;
}

const AviSelector: React.FC<AviSelectorProps> = ({ currentAvatarUrl, onAvatarSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    currentAvatarUrl || '/images/avatar/default-avatar.png'
  );
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState(
    currentAvatarUrl || '/images/avatar/default-avatar.png'
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset temp selection when closing without selecting
      setTempSelectedAvatar(selectedAvatar);
    }
    setIsOpen(open);
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    setTempSelectedAvatar(avatarUrl);
  };

  const handleConfirmSelection = () => {
    setSelectedAvatar(tempSelectedAvatar);
    onAvatarSelect(tempSelectedAvatar);
    setIsOpen(false);
  };

  // Array of available avatars
  const avatars = Array.from({ length: 14 }, (_, i) => `/images/avatar/avi-${i + 1}.png`);

  return (
    <div className="w-full">
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Your Avatar:</label>
      
      <div className="flex items-center space-x-4 border border-gray-300 dark:border-gray-700 p-2 rounded-md bg-white dark:bg-gray-800">
        <div className="relative w-20 h-20">
          {selectedAvatar && (
            <Image
              src={selectedAvatar}
              alt="Current Avatar"
              fill
              className="rounded-full object-cover"
            />
          )}
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="ml-4"
        >
          Change
        </Button>
      </div>

      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Choose Your Avatar
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {avatars.map((avatarUrl, index) => (
                    <button
                      key={avatarUrl}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                        tempSelectedAvatar === avatarUrl
                          ? 'border-purple-500 dark:border-purple-400'
                          : 'border-transparent hover:border-purple-500 dark:hover:border-purple-400'
                      }`}
                      onClick={() => handleSelectAvatar(avatarUrl)}
                    >
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700" />
                      <Image
                        src={avatarUrl}
                        alt={`Avatar ${index + 1}`}
                        fill
                        className="object-cover relative z-10"
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleConfirmSelection}
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default AviSelector;