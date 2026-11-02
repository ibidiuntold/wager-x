'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import faqData from '@/components/faq-data.json';
import SectionTitle from '@/components/common/SectionTitle';

// Define the prop types for the FAQItem component
interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
} 

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => (
  <div className="border-b border-gray-200 dark:border-gray-700">
    <button
      className="flex justify-between items-center w-full py-4 text-left"
      onClick={toggleOpen}
    >
      <span className="font-medium">{question}</span>
      {isOpen ? (
        <ChevronUp className="flex-shrink-0 ml-2" />
      ) : (
        <ChevronDown className="flex-shrink-0 ml-2" />
      )}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-4"
        >
          <p className="text-gray-600 dark:text-gray-300">{answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <SectionTitle title="Frequently Asked Questions" className="mb-4" />
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Find answers to common questions about our gaming platform
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch space-y-8 md:space-y-0 md:space-x-8">
          <div className="md:w-1/2 flex flex-col">
        <div className="space-y-4 flex-grow overflow-y-auto" style={{ maxHeight: '600px' }}>
          {/* Take first question from each category without showing category names */}
          {faqData.categories.map((category, index) => (
            <FAQItem
              key={index}
              question={category.questions[0].question}
              answer={category.questions[0].answer}
              isOpen={openIndex === index}
              toggleOpen={() => toggleOpen(index)}
            />
          ))}
        </div>
          </div>
          <div className="md:w-1/2 flex items-center justify-center">
            <div className="w-full h-full max-h-[300px] relative">
              <img
                src="/images/faq-illustration.png"
                alt="FAQ Illustration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <a
            href="/faq"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
          >
            Read More
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
