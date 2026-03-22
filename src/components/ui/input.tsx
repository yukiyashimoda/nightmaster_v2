import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border-2 border-brand-beige bg-white px-3 py-1 text-base font-medium shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-brand-plum/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-plum/40 disabled:cursor-not-allowed disabled:opacity-50 text-brand-plum",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
