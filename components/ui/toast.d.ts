import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"

export interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: "default" | "destructive"
  open?: boolean
}

export interface ToastState {
  toasts: {
    id: string
    title?: string
    description: string
    variant?: "default" | "destructive"
    open: boolean
  }[]
}

export type ToastActionElement = React.ReactElement<typeof ToastPrimitives.Action>
