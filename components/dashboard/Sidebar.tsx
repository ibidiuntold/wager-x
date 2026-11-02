'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, Users, Gamepad2, 
  PiggyBank, Wallet, Users2, BarChart2, TicketCheck, Megaphone,
  UserPlus, Settings, ShieldCheck
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const baseMenuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Manage Users', icon: Users, href: '/dashboard/manage-users' },
  { name: 'Manage Games', icon: Gamepad2, href: '/dashboard/manage-game' },
  { name: 'Deposits', icon: PiggyBank, href: '/dashboard/deposit' },
  { name: 'Withdrawals', icon: Wallet, href: '/dashboard/withdrawal' },
  { name: 'Broadcast', icon: Megaphone, href: '/dashboard/broadcast' },
  { name: 'Referrals', icon: Users2, href: '/dashboard/referral' },
  { name: 'Reports', icon: BarChart2, href: '/dashboard/report' },
  { name: 'Support Tickets', icon: TicketCheck, href: '/dashboard/support-ticket' },
  { name: 'Subscribers', icon: UserPlus, href: '/dashboard/subscriber' },
  { name: 'App Settings', icon: Settings, href: '/dashboard/settings' },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const menuItems = isAdmin
    ? [...baseMenuItems, { name: 'Admin Panel', icon: ShieldCheck, href: '/admin/dashboard' }]
    : baseMenuItems;

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} min-h-screen p-4 transition-all duration-300 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700`}>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link 
                href={item.href}
                className={`flex items-center p-2 rounded-lg ${
                  pathname === item.href 
                    ? 'bg-gray-200 dark:bg-gray-800' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className={`w-6 h-6 text-gray-400 dark:text-gray-500 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
