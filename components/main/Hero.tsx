'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Rocket, Briefcase, Sparkles, Users } from 'lucide-react';
// Utility function for conditional classes
// const cn = (...classes) => classes.filter(Boolean).join(' ');
import { useTheme } from '@/contexts/ThemeContext';
import AuthModal from '@/components/auth/AuthModal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isServer } from '@/lib/utils/isServer';
import { cn } from '@/lib/utils';

const HeroSlider = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login');
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleStartBetting = () => {
    if (status === 'authenticated') {
      router.push('/wagers');
    } else {
      setInitialAuthMode('register');
      setShowAuthModal(true);
    }
  };

  const slides = [
    {
      id: 1,
      image: "/images/hero/football-sports.svg",
      title: ["Bet on", " Everything"],
      subtitle: "Bet on everything from sports to politics, TV, and more — all in one place",
      gradient: "from-indigo-500 to-violet-500",
      category: "custom"
    },
    {
      id: 2,
      image: "/images/hero/digital-gift-card-abstract-concept.svg",
      title: ["Sign Up", " Bonus"],
      subtitle: "Join today and claim your welcome bonus to start wagering instantly",
      gradient: "from-green-500 to-emerald-600",
      category: "sports"
    },
    {
      id: 3,
      image: "/images/hero/flat-design-reseller-illustration.svg",
      title: ["Referral", " Bonus"],
      subtitle: "Invite your friends and earn rewards whenever they join and play",
      gradient: "from-red-500 to-orange-500",
      category: "referral"
    },
    {
      id: 4,
      image: "/images/hero/salary-payment-concept.svg",
      title: ["Instant", " Payouts"],
      subtitle: "Withdraw your winnings quickly and securely, with no delays",
      gradient: "from-purple-500 to-pink-500",
      category: "payouts"
    },
    {
      id: 5,
      image: "/images/hero/Snooker-board-game-1.svg",
      title: ["Custom", " Wagers"],
      subtitle: "Create unique wagers and challenge friends on anything you like",
      gradient: "from-yellow-500 to-lime-500",
      category: "custom"
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]); // run once and when slides length changes

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const nextSlide = useCallback(() => {
    if (isSliding) return;
    setIsSliding(true);
    setCurrentSlide(prev => (prev + 1) % slides.length);
    setTimeout(() => setIsSliding(false), 800);
  }, [isSliding, slides.length]);

  const prevSlide = useCallback(() => {
    if (isSliding) return;
    setIsSliding(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsSliding(false), 800);
  }, [isSliding, slides.length]);

  const goToSlide = (index) => {
    if (isSliding || index === currentSlide) return;
    setIsSliding(true);
    setCurrentSlide(index);
    setTimeout(() => setIsSliding(false), 800);
  };

  const currentSlideData = slides[currentSlide];

  const slideVariants = {
    enter: (direction) => {
      return {
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => {
      return {
        zIndex: 0,
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
      };
    },
  };

  const imageVariants = {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        initialMode={initialAuthMode}
        onClose={() => setShowAuthModal(false)}
      />
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-950 to-slate-900 text-white flex items-center justify-center">
        {/* Main Content Container with two-column layout */}
        <div className="relative z-20 container mx-auto px-6 lg:px-8 py-20 min-h-screen flex items-center">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-12">

            {/* Text Content */}
            <div className="lg:w-1/2 mt-12 lg:mt-0 text-center lg:text-left">
              {/* Animated Title */}
              <div className="mb-6 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideData.title[0]}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.77, 0, 0.175, 1],
                    }}
                    className="inline-block"
                  >
                    <h1 className="text-5xl md:text-7xl font-black mb-2">
                      {currentSlideData.title[0]}
                    </h1>
                  </motion.div>
                </AnimatePresence>
                {" "}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideData.title[1]}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15,
                      ease: [0.77, 0, 0.175, 1],
                    }}
                    className="inline-block"
                  >
                    <h1 className={cn(
                      "text-5xl md:text-7xl font-black",
                      `bg-gradient-to-r ${currentSlideData.gradient} text-transparent bg-clip-text`
                    )}>
                      {currentSlideData.title[1]}
                    </h1>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Animated Subtitle */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentSlideData.subtitle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-8"
                >
                  {currentSlideData.subtitle}
                </motion.p>
              </AnimatePresence>

              {/* Animated CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-10">
                <Button
                  onClick={handleStartBetting}
                  className={cn(
                    "px-8 py-4 text-md font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl",
                    `bg-gradient-to-r ${currentSlideData.gradient} text-white border-0 hover:shadow-purple-500/30`
                  )}
                >
                  Start Betting Now
                  <Rocket className="ml-2" />
                </Button>
                <Button
                  onClick={() => router.push('/wagers')}
                  className="px-8 py-4 text-md font-semibold rounded-full "
                >
                  Explore Wagers
                  <Sparkles className="ml-2" />
                </Button>
              </div>

              {/* Feature Icons */}
              {/* <div className="flex items-center justify-center lg:justify-start space-x-8 text-white/80">
                <div className="flex items-center space-x-2">
                  <Briefcase />
                  <span className="text-sm font-medium">Professional</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users />
                  <span className="text-sm font-medium">Community</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users />
                  <span className="text-sm font-medium">Innovative</span>
                </div>
              </div> */}
            </div>

            {/* Image Box */}
            <div className="relative w-5/6 md:w-[600px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group mx-auto">
              <Link href={{ pathname: '/wagers/create', query: { category: currentSlideData.category } }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentSlideData.image}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={imageVariants}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="relative"
                  >
                    <img
                      src={currentSlideData.image}
                      alt="Slide image"
                      className="w-full h-auto rounded-3xl block"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>

                    {/* Navigation Controls */}
                    {/* <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={prevSlide}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all duration-300"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all duration-300"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div> */}
                  </motion.div>
                </AnimatePresence>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === currentSlide
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/60"
                )}
                disabled={isSliding}
              />
            ))}
          </div>
        </div>
      </section >
    </>
  );
};

export default HeroSlider;
