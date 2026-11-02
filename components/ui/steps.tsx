"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepsProps {
  currentStep: number
  totalSteps: number
  className?: string
  renderTitle?: (step: number) => React.ReactNode
  renderSubtitle?: (step: number) => React.ReactNode
}

export function Steps({
  currentStep,
  totalSteps,
  className,
  renderTitle,
  renderSubtitle,
}: StepsProps) {
  return (
    <div className={cn("flex justify-between", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        const isLast = stepNumber === totalSteps
        
        return (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium",
                  "transition-all duration-200 ease-in-out",
                  isActive && "border-primary bg-primary text-primary-foreground scale-110",
                  isCompleted && "border-primary bg-primary/10 text-primary",
                  !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckIcon className="h-5 w-5" /> : stepNumber}
              </div>
              {(renderTitle || renderSubtitle) && (
                <div className="mt-2 space-y-1 text-center">
                  {renderTitle && (
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-primary",
                        isCompleted && "text-primary",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {renderTitle(stepNumber)}
                    </div>
                  )}
                  {renderSubtitle && (
                    <div 
                      className={cn(
                        "text-xs",
                        isActive && "text-muted-foreground",
                        isCompleted && "text-muted-foreground",
                        !isActive && !isCompleted && "text-muted-foreground/60"
                      )}
                    >
                      {renderSubtitle(stepNumber)}
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isLast && (
              <div className="flex-1 my-5 mx-2">
                <div
                  className={cn(
                    "h-0.5 w-full",
                    "transition-all duration-200 ease-in-out",
                    isCompleted
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default Steps