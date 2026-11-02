'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import siteData from '@/components/site-data.json';

const steps = [
  {
    number: 1,
    title: 'Choose Your Event',
    description: 'Browse through thousands of live and upcoming events across sports, politics, entertainment, and more'
  },
  {
    number: 2,
    title: 'Place Your Bet',
    description: 'Select your prediction, set your stake, and confirm your wager with real-time odds'
  },
  {
    number: 3,
    title: 'Win & Get Paid',
    description: 'Watch the event unfold and receive instant payouts when your prediction comes true'
  }
];

const DesktopStep = ({ step, index }: { step: typeof steps[0]; index: number }) => (
  <motion.div
    className="flex flex-col items-center text-center relative max-w-xs mx-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md px-14 py-10"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.2 }}
  >
    <div className="relative mb-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center p-0.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-lg">
        <span className="text-white text-3xl font-bold">{step.number}</span>
      </div>
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{step.title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
  </motion.div>
);

const MobileStep = ({ step, isActive }: { step: typeof steps[0]; isActive: boolean }) => (
  <motion.div
    key={step.number}
    className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center px-10 py-16"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95 }}
    transition={{ duration: 0.5 }}
  >
    <div className="relative mb-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center p-0.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-lg">
        <span className="text-white text-2xl font-bold">{step.number}</span>
      </div>
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
  </motion.div>
);

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 md:py-20 bg-transparent">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text dark:text-white text-gray-900">How It Works</h2>
          <p className="text-gray-600 dark:text-gray-400">Start betting in three simple steps</p>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <DesktopStep key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* Mobile View with Timer */}
        <div className="md:hidden relative h-64 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={activeStep} className="absolute inset-0">
              <MobileStep step={steps[activeStep]} isActive={true} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;