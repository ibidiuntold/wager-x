'use client';

import React, { useState } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import siteData from '@/components/site-data.json';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LayoutSelector from '@/components/common/LayoutSelector';

const SupportForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (captchaValue) {
    } else {
      alert('Please complete the reCAPTCHA');
    }
  };

  return (
    <LayoutSelector layoutType="main">
      <section className="py-12 px-2">
        <div className="container mx-auto p-2 min-h-[600px]">
          <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden bg-opacity-10 dark:bg-opacity-5 backdrop-filter backdrop-blur-md">
            <div className="md:w-1/2 p-8 bg-purple-200 dark:bg-gray-700 bg-opacity-20 dark:bg-opacity-10 backdrop-filter backdrop-blur-md">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Let's do amazing things together!</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300 text-xs">Please drop us a line so we can discuss partnership opportunities.</p>
              <p className="font-bold text-gray-800 dark:text-white">support@wagerx.ng</p>
              <p className="mt-4 text-gray-600 dark:text-gray-300 text-xs">Office hours: 10:00 - 19:00 GMT +01:00</p>
            </div>
            <form onSubmit={handleSubmit} className="md:w-1/2 p-4">
              <div className="mb-4">
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <ReCAPTCHA
                  sitekey={siteData.generalSettings.recaptchaId}
                  onChange={(value: string | null) => setCaptchaValue(value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>
    </LayoutSelector>
  );
};

export default SupportForm;