'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvatarCarouselProps {
  selectedAvatar: number;
  onSelect: (index: number) => void;
}

const AvatarCarousel: React.FC<AvatarCarouselProps> = ({ selectedAvatar, onSelect }) => {
  const avatars = Array.from({ length: 12 }, (_, i) => i + 1);
  const visibleAvatars = 5;
  const centerIndex = Math.floor(visibleAvatars / 2);

  const handlePrevious = () => {
    onSelect(selectedAvatar === 1 ? 12 : selectedAvatar - 1);
  };

  const handleNext = () => {
    onSelect(selectedAvatar === 12 ? 1 : selectedAvatar + 1);
  };

  const getVisibleAvatars = () => {
    const result = [];
    for (let i = -centerIndex; i <= centerIndex; i++) {
      let index = selectedAvatar + i;
      if (index < 1) index += 12;
      if (index > 12) index -= 12;
      result.push(index);
    }
    return result;
  };

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="h-8 w-8 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-4 overflow-hidden py-2">
        {getVisibleAvatars().map((avatarNum, index) => (
          <motion.div
            key={avatarNum}
            className={`relative cursor-pointer ${
              index === centerIndex ? 'scale-125 z-10' : 'scale-100 opacity-60'
            }`}
            animate={{
              scale: index === centerIndex ? 1.25 : 1,
              opacity: index === centerIndex ? 1 : 0.6,
            }}
            transition={{ duration: 0.3 }}
            onClick={() => onSelect(avatarNum)}
          >
            <img
              src={`/images/avatar/avi-${avatarNum}.png`}
              alt={`Avatar ${avatarNum}`}
              className="w-16 h-16 min-w-16 rounded-full"
              draggable="false"
            />
            {index === centerIndex && (
              <motion.div
                className="absolute inset-0 border-2 border-purple-500 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="h-8 w-8 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AvatarCarousel;