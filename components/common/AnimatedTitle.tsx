'use client';

import { useEffect, useState, useRef } from 'react';

const titles = [
  "WagerX 🎮 Game On!",
  "WagerX 🎲 Place Your Bets",
  "WagerX 🏆 Win Big!",
  "WagerX 💰 Time to Wager",
  "WagerX ⚡ Let's Play!",
  "WagerX 🎯 Get Ready",
];

export default function AnimatedTitle() {
  const [currentTitle, setCurrentTitle] = useState(titles[0]);
  const titleRef = useRef(currentTitle);
  
  useEffect(() => {
    titleRef.current = currentTitle;
  }, [currentTitle]);

  useEffect(() => {
    let titleTimeoutId: NodeJS.Timeout;
    let scrollTimeoutId: NodeJS.Timeout;
    let position = 0;

    const updateTitle = () => {
      const currentIndex = titles.indexOf(titleRef.current);
      const nextIndex = (currentIndex + 1) % titles.length;
      setCurrentTitle(titles[nextIndex]);
      titleTimeoutId = setTimeout(updateTitle, 3000);
    };

    const scrollTitle = () => {
      const scrollingTitle = titleRef.current + " ⋅ " + titleRef.current;
      position = (position + 1) % titleRef.current.length;
      const scrolledText = scrollingTitle.substring(position) + scrollingTitle.substring(0, position);
      document.title = scrolledText.substring(0, 30); // Limit length to avoid too long titles
      scrollTimeoutId = setTimeout(scrollTitle, 150); // Adjust speed here
    };

    titleTimeoutId = setTimeout(updateTitle, 3000);
    scrollTitle();

    return () => {
      if (titleTimeoutId) clearTimeout(titleTimeoutId);
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      document.title = "WagerX";
    };
  }, []); // Empty dependency array - only run on mount and unmount

  return null;
}