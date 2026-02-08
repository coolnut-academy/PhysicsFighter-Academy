import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
          // 🥋 Rounded button style with soft shadows
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wider ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-ink-black rounded-xl",
          {
                    variants: {
                              variant: {
                                        // Fighter Red - Primary Action
                                        default:
                                                  "bg-fighter-red text-white hover:bg-fighter-red-dark shadow-md hover:shadow-lg hover:-translate-y-0.5",

                                        // Destructive - Same as default but for delete actions
                                        destructive:
                                                  "bg-fighter-red text-white hover:bg-fighter-red-dark shadow-md hover:shadow-lg hover:-translate-y-0.5",

                                        // Outline - White with black border
                                        outline:
                                                  "bg-white text-ink-black hover:bg-gray-100 shadow-md hover:shadow-lg hover:-translate-y-0.5",

                                        // Secondary - Black button
                                        secondary:
                                                  "bg-ink-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg hover:-translate-y-0.5",

                                        // Ghost - No background, subtle hover
                                        ghost:
                                                  "bg-transparent text-ink-black hover:bg-gray-100 border-transparent shadow-none",

                                        // Link - Text only
                                        link:
                                                  "bg-transparent text-fighter-red underline-offset-4 hover:underline border-transparent shadow-none",

                                        // Golden - For special actions (wins, scores)
                                        golden:
                                                  "bg-golden text-ink-black hover:bg-golden-light shadow-md hover:shadow-lg hover:-translate-y-0.5",
                              },
                              size: {
                                        default: "h-10 px-5 py-2",
                                        sm: "h-9 px-4 text-xs",
                                        lg: "h-12 px-8 text-base",
                                        icon: "h-10 w-10",
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
                                        className={cn(buttonVariants({ variant, size, className }))}
                                        ref={ref}
                                        {...props}
                              />
                    )
          }
)
Button.displayName = "Button"

export { Button, buttonVariants }
