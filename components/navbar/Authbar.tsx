'use client';

import React from 'react';
import Link from 'next/link';

const Authbar = () => {
  return (
    <nav className="sticky top-0 bg-transparent h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="absolute left-1/2 transform -translate-x-1/2 flex justify-center items-center h-full">
            <Link href="/" className="hover:animate-pulse">
              <img
                src="/images/logo/Logo.svg"
                alt="Logo"
                className="h-14 w-auto"
              />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Authbar;