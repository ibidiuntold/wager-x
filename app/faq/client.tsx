'use client';

import React, { useState } from "react";
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";

// Dynamically import framer-motion components with ssr: false
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
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
        <MotionDiv
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-4"
        >
          <p className="text-gray-600 text-sm dark:text-gray-400">{answer}</p>
        </MotionDiv>
      )}
    </AnimatePresence>
  </div>
);

interface FAQCategoryProps {
  name: string;
  questions: Array<{ question: string; answer: string }>;
}

const FAQCategory: React.FC<FAQCategoryProps> = ({ name, questions }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {name}
      </h2>
      <div className="rounded-lg">
        {questions.map((item, index) => (
          <FAQItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            toggleOpen={() => toggleOpen(index)}
          />
        ))}
      </div>
    </div>
  );
};

interface FAQClientProps {
  data: {
    categories: Array<{
      name: string;
      questions: Array<{ question: string; answer: string }>;
    }>;
  };
}

export default function FAQClient({ data }: FAQClientProps) {
  return (
    <MainLayout>
      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Page Heading */}
          <div className="text-center mb-12 py-16">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find answers to common questions about WagerX gaming platform.
              Can’t find what you’re looking for? Contact our support team.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="max-w-4xl mx-auto">
            {data.categories.map((category, index) => (
              <FAQCategory
                key={index}
                name={category.name}
                questions={category.questions}
              />
            ))}
          </div>

          {/* Support CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Still have questions? We're here to help!
            </p>
            <a
              href="/support"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}