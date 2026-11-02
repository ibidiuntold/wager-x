import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const SpinningBackground: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 flex items-center justify-center -z-10 overflow-hidden">
      <div
        className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-cover bg-center animate-spin-slow"
        style={{
          backgroundImage: theme === 'light'
            ? 'url("/images/backgrounds/light_lg_bg.svg")'
            : 'url("/images/backgrounds/dark_lg_bg.svg")',
        }}
      ></div>
    </div>
  );
};

export default SpinningBackground;