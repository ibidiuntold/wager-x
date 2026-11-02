'use client';

import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

interface SocialLink {
  id: string;
  name: string;
  link: string;
  icon: string;
}

const iconMap: { [key: string]: React.ElementType } = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
};

// Define your social links locally instead of fetching from API
const socialLinks: SocialLink[] = [
  {
    id: '1',
    name: 'Instagram',
    link: 'https://www.instagram.com/wagerxng/',
    icon: 'instagram',
  },
  {
    id: '2',
    name: 'Facebook',
    link: 'https://www.facebook.com/',
    icon: 'facebook',
  },
  {
    id: '3',
    name: 'Twitter',
    link: 'https://twitter.com/',
    icon: 'twitter',
  },
];

export default function SocialLinks() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Follow Us</h2>
      <ul className="flex gap-4">
        {socialLinks.map((link) => {
          const Icon = iconMap[link.icon];
          return (
            <li key={link.id}>
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-blue-500 transition"
              >
                {Icon && <Icon className="w-5 h-5" />}
                {/* <span>{link.name}</span> */}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
