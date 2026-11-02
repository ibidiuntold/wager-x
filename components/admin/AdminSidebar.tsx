'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronDown,
  Menu,
} from "lucide-react";
import { navItems } from '@/lib/admin/config';
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/ui/notification-badge";

interface AdminSidebarProps {
  pendingCount: number;
  isMobile: boolean;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({ 
  pendingCount, 
  isMobile, 
  collapsed, 
  setCollapsed 
}: AdminSidebarProps) {
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const pathname = usePathname();

  // Keep submenu open if current path matches any of its items
  useEffect(() => {
    const matchingParents = navItems
      .filter(item => item.submenu && item.submenu.some(subItem => pathname === subItem.href))
      .map(item => item.title);
    
    if (matchingParents.length > 0) {
      setOpenSubmenus(prev => 
        [...new Set([...prev, ...matchingParents])]
      );
    }
  }, [pathname]);

  // Toggle sidebar handler
  const toggleSidebar = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  // Close sidebar when clicking on a link (mobile only)
  const handleLinkClick = useCallback(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile, setCollapsed]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "bg-gradient-to-br from-card via-card/90 to-card/70 border-r dark:border-gray-800/40 flex flex-col transition-all duration-300 shadow-lg z-50",
          "dark:from-slate-800/80 dark:via-slate-850/50 dark:to-slate-900/30 dark:border-slate-700/20",
          collapsed ? "w-[68px]" : "w-[240px]", // Increased width when collapsed for better alignment
          isMobile && collapsed ? "-ml-[68px]" : "",
          isMobile && !collapsed ? "fixed inset-y-0 left-0 w-[240px]" : ""
        )}
      >
        {/* Logo area */}
        <div className="h-14 border-b dark:border-gray-800/40 flex items-center px-4 sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 dark:bg-slate-850/50">
          {!collapsed && (
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo/Logo.svg"
                alt="WagerX"
                width={120}
                height={40}
                priority={true}
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "ml-auto",
              collapsed ? "mx-auto" : "",
              "hover:bg-primary/20 transition-colors"
            )}
            onClick={toggleSidebar}
          >
            {collapsed ? (
              <Menu className="h-4 w-4" /> // Smaller icon for better alignment
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.submenu 
              ? item.submenu.some(subItem => pathname === subItem.href)
              : pathname === item.href;
            
            if (item.submenu) {
              return (
                <div key={item.title} className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenSubmenus(prev => 
                        prev.includes(item.title)
                          ? prev.filter(title => title !== item.title)
                          : [...prev, item.title]
                      );
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
                      "hover:bg-primary/20 hover:text-primary hover:shadow-md hover:translate-x-1",
                      isActive 
                        ? "bg-primary/20 text-primary shadow-md dark:bg-primary/20 font-medium" 
                        : "text-foreground/70 dark:text-white/70",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <div className="relative flex items-center">
                      <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                      {item.title === 'Payments' && pendingCount > 0 && (
                        <NotificationBadge count={pendingCount} />
                      )}
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          openSubmenus.includes(item.title) && "transform rotate-180"
                        )} />
                      </>
                    )}
                  </button>
                  <div className={cn(
                    "pl-8 mt-1 space-y-1 overflow-hidden transition-all duration-200",
                    openSubmenus.includes(item.title) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    {item.submenu.map((subItem) => {
                      const isSubItemActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href || ''}
                          href={subItem.href || '#'}
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            "hover:bg-primary/15 hover:text-primary hover:shadow-md hover:translate-x-1",
                            isSubItemActive 
                              ? "bg-primary/15 text-primary shadow-md dark:bg-primary/15 font-medium" 
                              : "text-foreground/70 dark:text-white/70"
                          )}
                        >
                          <div className="relative flex items-center">
                            <subItem.icon className={cn("h-4 w-4", isSubItemActive && "text-primary")} />
                            {subItem.title === 'Settlements' && pendingCount > 0 && (
                              <NotificationBadge count={pendingCount} />
                            )}
                          </div>
                          <span>{subItem.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href || ''}
                href={item.href || '#'}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  "hover:bg-primary/20 hover:text-primary hover:shadow-md hover:translate-x-1",
                  isActive 
                    ? "bg-primary/20 text-primary shadow-md dark:bg-primary/20 font-medium" 
                    : "text-foreground/70 dark:text-white/70",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}