'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="bottom-0 left-0 w-full text-gray-400 bg-white dark:bg-gray-900">
      <div className="container mx-auto">
        <div className="flex justify-center items-center py-4 border-t border-gray-700">
          <p className="text-sm">
            © 2025 WagerX. All rights reserved. | Bet responsibly. Must be 18+
          </p>
        </div>
        <div className="flex justify-center items-center py-2">
          <a href="/terms-and-conditions" className="text-xs text-gray-500 hover:text-gray-300 mx-2">
            Terms and Conditions
          </a>
          <span className="text-xs text-gray-500">|</span>
          <a href="/privacy-policy" className="text-xs text-gray-500 hover:text-gray-300 mx-2">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
