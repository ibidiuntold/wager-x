import { 
    Users, 
    GamepadIcon, 
    Target, 
    FileText, 
    CreditCard,
    LayoutDashboard,
    Wallet,
    HandCoins,
    Share2,
    Globe,
    Mail,
    Users2,
    SendHorizontal,
    Bell,
    Settings,
  } from "lucide-react";
  import { LucideIcon } from 'lucide-react';
  import { useState } from 'react';
  import { DocumentData } from 'firebase/firestore';

  
  // Navigation item interface
  export interface NavItem {
    title: string;
    href?: string;
    icon: LucideIcon;
    submenu?: Omit<NavItem, 'submenu'>[];
  }
  
  // Admin navigation items
  export const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users
    },
    {
      title: 'Wagers',
      href: '/admin/wagers',
      icon: Target
    },
    {
      title: 'Notifications',
      href: '/admin/notifications',
      icon: Bell
    },
    {
      title: 'Newsletter',
      icon: Mail,
      submenu: [
        {
          title: 'Subscribers',
          href: '/admin/newsletter/subscribers',
          icon: Users2
        },
        {
          title: 'Broadcast',
          href: '/admin/newsletter/broadcast',
          icon: SendHorizontal
        }
      ]
    },
    {
      title: 'Payments',
      icon: CreditCard,
      submenu: [
        {
          title: 'Transactions',
          href: '/admin/transactions',
          icon: Wallet
        },
        {
          title: 'Settlements',
          href: '/admin/settlements',
          icon: HandCoins
        }
      ]
    },
    {
      title: 'Bonuses',
      href: '/admin/bonuses',
      icon: FileText
    },
    {
      title: 'Referrals',
      href: '/admin/referrals',
      icon: Share2
    },
    {
      title: 'Site Settings',
      href: '/admin/settings',
      icon: Globe
    }
  ];
  
  // Common dashboard card colors
  export const cardColors = {
    users: "from-blue-500 to-blue-600",
    games: "from-purple-500 to-purple-600",
    wagers: "from-green-500 to-green-600",
    amount: "from-yellow-500 to-yellow-600",
    deposits: "from-emerald-500 to-emerald-600", 
    withdrawals: "from-rose-500 to-rose-600"
  };
  
  // Dashboard pagination configuration
  export const paginationConfig = {
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 10
  };
  
  // Status/filter options for common dashboard components
  export const statusOptions = {
    all: { value: 'all', label: 'All Status' },
    active: { value: 'active', label: 'Active' },
    inactive: { value: 'inactive', label: 'Inactive' },
    pending: { value: 'pending', label: 'Pending' },
    completed: { value: 'completed', label: 'Completed' },
    suspended: { value: 'suspended', label: 'Suspended' },
    banned: { value: 'banned', label: 'Banned' }
  };
  
  // Common animation variants for Framer Motion
  export const adminAnimations = {
    container: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05 // Reduced from 0.1 for smoother UX
        }
      }
    },
    item: {
      hidden: { y: 10, opacity: 0 }, // Reduced from y: 20 for subtler animation
      show: { y: 0, opacity: 1 }
    }
  };

  export function usePagination<T>() {
    const [currentPage, setCurrentPage] = useState(1);
    const [firstDoc, setFirstDoc] = useState<DocumentData | null>(null);
    const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
    const [pageSize, setPageSize] = useState<number>(paginationConfig.defaultPageSize);
  
    const resetPagination = () => {
      setCurrentPage(1);
      setFirstDoc(null);
      setLastDoc(null);
    };
  
    const handleNextPage = (items: T[]) => {
      if (items.length === pageSize) {
        setCurrentPage(prev => prev + 1);
      }
    };
  
    const handlePrevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    };
  
    return {
      currentPage,
      setCurrentPage,
      firstDoc,
      setFirstDoc,
      lastDoc,
      setLastDoc,
      pageSize,
      setPageSize,
      resetPagination,
      handleNextPage,
      handlePrevPage
    };
  }
  
  // Utility function for formatting dates
  export function formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  }
  
  // Utility function for formatting currency
  export function formatCurrency(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
  
  // Utility function for capitalization
  export function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }