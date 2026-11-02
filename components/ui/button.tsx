"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20 dark:shadow-purple-600/20 active:translate-y-0.5",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20 dark:shadow-red-600/20 active:translate-y-0.5",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 shadow-sm hover:shadow dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 active:translate-y-0.5",
        secondary:
          "bg-gradient-to-b from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700 shadow-lg shadow-slate-500/20 dark:shadow-slate-600/20 active:translate-y-0.5",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 active:translate-y-0.5",
        link:
          "text-purple-500 underline-offset-4 hover:underline hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 py-2 text-xs",
        lg: "h-12 rounded-md px-8",
        icon: "h-11 w-11", 
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }