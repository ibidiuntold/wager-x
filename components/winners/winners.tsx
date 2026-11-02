'use client';

import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import users from './users.json';
import siteData from '@/components/site-data.json';

interface Card {
  id: number;
  nickname: string;
  phone: string;
  amount: string;
  time: string;
  category: string;
  isSuper?: boolean;
}

const WinningCarousel = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generateWinningAmount = (category: string, isSuper: boolean = false) => {
    const homeTake = siteData.generalSettings.homeTake / 100;
    if (isSuper) {
      const amount = Math.floor(Math.random() * 9000000) + 1000000;
      return amount * (1 - homeTake);
    }
    const wagerAmounts = [100, 200, 500, 1000, 2000, 5000, 10000];
    const baseAmount = wagerAmounts[Math.floor(Math.random() * wagerAmounts.length)];
    if (category === 'bonus') {
      return Math.min(baseAmount, 5000);
    }
    const winningAmount = baseAmount * (Math.floor(Math.random() * 100) + 1);
    return winningAmount * (1 - homeTake);
  };

  const generateCards = (): Card[] => {
    let generatedCards = users.users.map(user => {
      const isSuper = user.category === 'wager' && Math.random() < 0.01;
      const amount = generateWinningAmount(user.category, isSuper);
      return {
        id: user.id,
        nickname: user.nickname.substring(0, 3) + '*'.repeat(user.nickname.length - 3),
        phone: user.phone.substring(0, 2) + '*'.repeat(7) + user.phone.slice(-2),
        amount: `${siteData.generalSettings.currencySymbol}${formatAmount(amount)}`,
        time: `${Math.floor(Math.random() * 10) + 1}min ago`,
        category: user.category,
        isSuper
      };
    });

    for (let i = generatedCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generatedCards[i], generatedCards[j]] = [generatedCards[j], generatedCards[i]];
    }

    return generatedCards;
  };

  useEffect(() => {
    const newCards = generateCards();
    setCards(newCards);
    setShowConfetti(newCards.some(card => card.isSuper));

    const interval = setInterval(() => {
      const updatedCards = generateCards();
      setCards(updatedCards);
      setShowConfetti(updatedCards.some(card => card.isSuper));
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-6 sm:py-12 relative overflow-hidden mt-6 rounded-xl">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-white-500/10 dark:from-purple-900/30 dark:to-gray-900/10 backdrop-blur-md"></div>
      <div className="container mx-auto px-2 sm:px-4 relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center text-purple-800 dark:text-purple-300">
          {siteData.generalSettings.appName} Winners
        </h2>
        <div className="w-full overflow-hidden h-[120px] sm:h-[150px]">
          <div className="flex animate-carousel">
            {[...cards, ...cards].map((card, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-48 sm:w-64 h-24 sm:h-32 m-1 sm:m-2 p-2 sm:p-4 rounded-xl shadow-lg relative ${
                  card.isSuper
                    ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 dark:from-yellow-600 dark:to-yellow-800'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                {card.category === 'wager' ? (
                  <span className="absolute top-1 right-1 sm:top-2 sm:right-2 text-yellow-500 text-sm sm:text-base">🏆</span>
                ) : (
                  <span className="absolute top-1 right-1 sm:top-2 sm:right-2 text-blue-500 text-sm sm:text-base">⭐</span>
                )}
                <div className={`text-xs sm:text-sm font-semibold ${card.isSuper ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {card.nickname}
                </div>
                <div className={`text-xs ${card.isSuper ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {card.phone}
                </div>
                <div className={`text-sm sm:text-lg font-bold ${card.isSuper ? 'text-black dark:text-white' : 'text-green-600 dark:text-green-400'} mt-1 sm:mt-2`}>
                  {card.amount}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className={`text-xs ${card.isSuper ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {card.time}
                  </div>
                  <div className={`text-xs font-semibold ${card.isSuper ? 'text-black dark:text-white' : 'text-purple-600 dark:text-purple-400'}`}>
                    {card.isSuper ? 'SUPER WAGER' : card.category.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes carousel {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-carousel {
          animation: carousel 30s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-carousel {
            animation-duration: 10s;
          }
        }
      `}</style>
    </section>
  );
};

export default WinningCarousel;