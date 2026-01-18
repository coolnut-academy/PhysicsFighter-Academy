import * as React from "react"

import { cn } from "@/lib/utils"

// 🥋 Arcade Card - White with thick black border and hard drop shadow
const Card = React.forwardRef<
          HTMLDivElement,
          React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
          <div
                    ref={ref}
                    className={cn(
                              "bg-white border-[3px] border-ink-black rounded-md text-card-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-150",
                              className
                    )}
                    {...props}
          />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
          HTMLDivElement,
          React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
          <div
                    ref={ref}
                    className={cn("flex flex-col space-y-1.5 p-6", className)}
                    {...props}
          />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
          HTMLParagraphElement,
          React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
          <h3
                    ref={ref}
                    className={cn(
                              "text-2xl font-heading uppercase tracking-wide text-ink-black",
                              className
                    )}
                    {...props}
          />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
          HTMLParagraphElement,
          React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
          <p
                    ref={ref}
                    className={cn("text-sm text-gray-600", className)}
                    {...props}
          />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
          HTMLDivElement,
          React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
          <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
          HTMLDivElement,
          React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
          <div
                    ref={ref}
                    className={cn("flex items-center p-6 pt-0", className)}
                    {...props}
          />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
