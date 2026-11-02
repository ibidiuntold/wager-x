'use client';

import { ReactNode } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from '@/lib/utils';
import { 
  paginationConfig, 
  statusOptions,
  formatDate,
  formatCurrency 
} from '@/lib/admin/config';

// SearchBar component
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  width?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  width = "w-[300px]"
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("pl-9", width)}
      />
    </div>
  );
}

// StatusFilter component
interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  width?: string;
}

export function StatusFilter({ 
  value, 
  onChange, 
  options = Object.values(statusOptions),
  className = "",
  width = "w-[150px]" 
}: StatusFilterProps) {
  return (
    <div className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={width}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className='bg-white dark:bg-gray-800'>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// PageSizeSelector component
interface PageSizeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  className?: string;
  width?: string;
}

export function PageSizeSelector({
  value,
  onChange,
  options = paginationConfig.pageSizeOptions,
  className = "",
  width = "w-[100px]"
}: PageSizeSelectorProps) {
  return (
    <div className={className}>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onChange(parseInt(val))}
      >
        <SelectTrigger className={width}>
          <SelectValue placeholder="Show" />
        </SelectTrigger>
        <SelectContent className='bg-white dark:bg-gray-800'>
          {options.map(size => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// PaginationControls component
interface PaginationControlsProps {
  currentPage: number;
  totalPages?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  align?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasMore,
  onPageChange,
  isLoading = false,
  align = 'between',
  className = ""
}: PaginationControlsProps) {
  const handlePrevPage = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if ((totalPages ? currentPage < totalPages : hasMore) && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  const alignmentClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn("flex items-center px-4 py-4 border-t", alignmentClasses[align], className)}>
      <div className="text-sm text-muted-foreground">
        Page {currentPage} {totalPages ? `of ${totalPages}` : ''}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage === 1 || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={(totalPages ? currentPage >= totalPages : !hasMore) || isLoading}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Dashboard Card component without animations
interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  colorClass?: string;
  onClick?: () => void;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  colorClass = "",
  onClick,
  className = ""
}: DashboardCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-gradient-to-br hover:shadow-lg",
        colorClass,
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-between pb-2 px-4 pt-4 relative">
        <h5 className="text-sm font-medium text-white">{title}</h5>
        {icon && <div className="h-4 w-4 text-white/70">{icon}</div>}
      </div>
      <div className="px-4 pb-4 relative">
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-white/80 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Table loading state component
interface TableLoadingStateProps {
  columns: number;
  rows?: number;
}

export function TableLoadingState({ columns, rows = 3 }: TableLoadingStateProps) {
  return (
    <>
      {Array(rows).fill(0).map((_, i) => (
        <tr key={i} className="dark:border-gray-700">
          {Array(columns).fill(0).map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// DashboardControls - combines search, filter and page size
interface DashboardControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  pageSizeValue: number;
  onPageSizeChange: (value: number) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  searchPlaceholder?: string;
  className?: string;
}

export function DashboardControls({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  pageSizeValue,
  onPageSizeChange,
  statusOptions,
  searchPlaceholder = "Search...",
  className = ""
}: DashboardControlsProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 mb-4", className)}>
      <SearchBar 
        value={searchValue} 
        onChange={onSearchChange} 
        placeholder={searchPlaceholder}
      />
      <div className="flex items-center gap-4">
        <StatusFilter 
          value={statusValue}
          onChange={onStatusChange}
          options={statusOptions}
        />
        <PageSizeSelector
          value={pageSizeValue}
          onChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}

// Export additional utility functions for backwards compatibility
export { paginationConfig, statusOptions, formatDate, formatCurrency };