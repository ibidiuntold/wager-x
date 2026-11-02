'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import siteData from '@/components/site-data.json';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useToast } from '@/components/ui/use-toast';

interface NewsletterProps {}

const Newsletter: React.FC<NewsletterProps> = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { subscribeToNewsletter } = useNewsletter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await subscribeToNewsletter(email);
      setIsSubmitted(true);
      setEmail('');
      toast({
        title: 'Successfully subscribed!',
        description: 'You will now receive our newsletter updates'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 rounded-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[rgba(185,127,243,0.1)] dark:bg-[rgba(78,137,220,0.1)] bg-opacity-10 backdrop-filter backdrop-blur-md"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-purple-800 dark:text-purple-300">
              {siteData.newsletterTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {siteData.newsletterSubtitle}
            </p>
            
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-green-600 dark:text-green-400 font-semibold"
              >
                Thank you for subscribing!
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={siteData.newsletterPlaceholder}
                  required
                  disabled={isSubmitting}
                  className="flex-grow px-4 py-2 rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  {isSubmitting ? 'Subscribing...' : siteData.newsletterButtonText}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
