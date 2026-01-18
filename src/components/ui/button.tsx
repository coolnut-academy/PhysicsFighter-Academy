import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
          // 🥋 Base arcade button style - skewed with bold borders
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wider ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-ink-black -skew-x-6",
          {
                    variants: {
                              variant: {
                                        // Fighter Red - Primary Action
                                        default:
                                                  "bg-fighter-red text-white hover:bg-fighter-red-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",

                                        // Destructive - Same as default but for delete actions
                                        destructive:
                                                  "bg-fighter-red text-white hover:bg-fighter-red-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",

                                        // Outline - White with black border
                                        outline:
                                                  "bg-white text-ink-black hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",

                                        // Secondary - Black button
                                        secondary:
                                                  "bg-ink-black text-white hover:bg-gray-800 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] hover:shadow-[1px_1px_0px_0px_rgba(220,38,38,1)] hover:translate-x-[2px] hover:translate-y-[2px]",

                                        // Ghost - No background, subtle hover
                                        ghost:
                                                  "bg-transparent text-ink-black hover:bg-gray-100 border-transparent shadow-none skew-x-0",

                                        // Link - Text only
                                        link:
                                                  "bg-transparent text-fighter-red underline-offset-4 hover:underline border-transparent shadow-none skew-x-0",

                                        // Golden - For special actions (wins, scores)
                                        golden:
                                                  "bg-golden text-ink-black hover:bg-golden-light shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]",
                              },
                              size: {
                                        default: "h-10 px-5 py-2",
                                        sm: "h-9 px-4 text-xs",
                                        lg: "h-12 px-8 text-base",
                                        icon: "h-10 w-10 skew-x-0",
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
