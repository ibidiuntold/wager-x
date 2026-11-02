'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent dark:from-purple-500/10 dark:to-transparent blur-sm" />
      <div className="relative bg-white/50 dark:bg-gray-900/50 border-l-4 border-purple-500 dark:border-purple-400 px-4 py-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
    </motion.div>
  );
};

export default SectionTitle;
