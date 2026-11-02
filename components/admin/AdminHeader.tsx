'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { Menu, Moon, Sun } from "lucide-react";
import NotificationBell from "@/components/notification/NotificationBell"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminHeaderProps {
  isMobile: boolean;
  toggleSidebar: () => void;
}

export function AdminHeader({ isMobile, toggleSidebar }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  
  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      // First clear the admin session
      await fetch('/api/admin/auth', {
        method: 'DELETE'
      });
      // Then sign out from Firebase
      await logout();
      // Finally redirect to login
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [logout, router]);

  return (
    <header className="h-14 border-b dark:border-gray-800/40 flex items-center gap-4 px-4 sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      <div className="ml-auto flex items-center gap-4">
        {/* Using the NotificationBell component that manages its own state */}
        <NotificationBell className="h-8 w-8" /> 
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={toggleTheme}
          className="hover:bg-primary/10 hover:text-primary transition-colors duration-200"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/images/placeholder-avatar.jpg" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-0">
            <div className={cn(
              "bg-card dark:bg-slate-800 shadow-lg rounded-md overflow-hidden",
              "border-0 min-w-[8rem]" // Fix for menu width
            )}>
              <DropdownMenuItem className="hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors duration-200 px-3 py-2">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors duration-200 px-3 py-2"
                onClick={handleLogout}
              >
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}