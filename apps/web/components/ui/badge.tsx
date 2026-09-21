import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-600 text-white dark:bg-surface-800 dark:text-surface-100",
        secondary: "border-transparent bg-surface-100 text-surface-900",
        destructive: "border-transparent bg-red-500 text-white dark:bg-red-900/50 dark:text-red-300",
        outline: "text-surface-700",
        success: "border-transparent bg-green-100 text-green-700",
        warning: "border-transparent bg-amber-100 text-amber-700",
        purple: "border-transparent bg-purple-100 text-purple-700",
        pink: "border-transparent bg-pink-100 text-pink-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }