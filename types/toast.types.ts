import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"

export interface ToastProps {
  variant?: "default" | "destructive"
  title?: string
  description: string
  open?: boolean
}

export interface Toast extends ToastProps {
  id: string
  open: boolean
  variant: "default" | "destructive"
}

export interface ToastState {
  toasts: Toast[]
}

export type ToastActionElement = React.ReactElement<typeof ToastPrimitives.Action>

export interface ToastComponentProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: "default" | "destructive"
  duration?: number
}
