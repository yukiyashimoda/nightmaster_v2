import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border-2 border-brand-beige bg-white px-3 py-2 text-base font-medium shadow-sm placeholder:text-brand-plum/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-plum/40 disabled:cursor-not-allowed disabled:opacity-50 text-brand-plum",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
