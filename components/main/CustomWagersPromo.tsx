'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const CustomWagersPromo = () => {
  const router = useRouter();

  const navigateToWagers = () => {
    router.push('/wagers');
  };

  return (
    <section className="py-12 relative overflow-hidden">
      {/* First Section - Payment Options */}
      <div className="bg-gray-900/90 dark:bg-gray-950/30 py-12 relative rounded-t-lg backdrop-blur-md">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-6">No Stress Deposits</h2>
          <p className="text-center text-sm text-gray-300 max-w-2xl mx-auto mb-12">
            We accept most major payment methods and work with
            some of the most trusted payments companies in the world.
          </p>

          <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap">
            <div className="w-28 h-12 relative grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <Image src="/images/payments/paystack.png" alt="Paystack" fill className="object-contain invert dark:invert-0" />
            </div>
            <div className="w-32 h-12 relative grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <Image src="/images/payments/flutterwave.png" alt="Flutterwave" fill className="object-contain invert dark:invert-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Section - Custom Wagers */}
      <div className="rounded-b-lg bg-gradient-to-tr from-purple-400/30 to-gray-400/30 dark:from-purple-700/30 dark:to-gray-950/30 py-8 relative backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto">
            {/* Phone Image */}
            <motion.div 
              className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative z-10"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <div className="relative h-[580px] w-[340px] drop-shadow-2xl md:-mt-40">
                <Image 
                  src="/images/custom-wager-phone.png" 
                  alt="Custom Wagers on Mobile" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>
            </motion.div>

            {/* Text Content */}
            <motion.div 
              className="w-full md:w-1/2 md:pl-4"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">INTRODUCING</h3>
              <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white tracking-tighter">
                Custom Wagers
              </h2>
              <p className="text-md mb-8 text-gray-800 dark:text-gray-100 max-w-md">
                With Custom Wagers, you are in complete control of your betting experience.
                Create your own wagers on any event, set the terms, and invite friends to participate.
                You decide what to bet on and how the winnings are distributed.
              </p>
              <div className="flex">
                <Button 
                  onClick={navigateToWagers} 
                  className="bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white px-8 py-6 text-md"
                >
                  Create Your Wager
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomWagersPromo;