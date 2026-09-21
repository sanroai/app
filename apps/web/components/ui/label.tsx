import * as React from "react"
import { cn } from "@/lib/cn"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-semibold leading-none text-surface-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-surface-300",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }