"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useNavigation } from "react-day-picker"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Custom Navigation Component
  function CustomNavigation({ 
    displayMonth 
  }: { 
    displayMonth: Date 
  }) {
    const { goToMonth, nextMonth, previousMonth } = useNavigation()
    
    return (
      <div className="flex items-center justify-between px-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-transparent p-0"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        
        <div className="flex items-center justify-center gap-2">
          <span className="font-medium text-sm">
            {format(displayMonth, "MMMM")}
          </span>
          <span className="text-sm text-muted-foreground">
            {format(displayMonth, "yyyy")}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-transparent p-0"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>
    )
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white dark:bg-slate-900 shadow-md rounded-lg text-center", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 text-gray-900 dark:text-gray-100",
        today: `border-amber-500`,
        selected: `bg-primary border-amber-500 text-white`,
        root: `shadow-lg p-5`,
        chevron: `fill-slate-700 dark:fill-slate-200`,
        caption: "justify-center pt-1 relative items-center",
        caption_label: "text-md font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100 transition-opacity duration-200"
        ),
        table: "w-full border-collapse space-y-1 bg-inherit",
        head_row: "flex",
        head_cell:"text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        day_today: "bg-accent/10 text-accent-foreground aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomNavigation
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }