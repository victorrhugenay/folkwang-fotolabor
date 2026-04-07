import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[11px] border-[1.5px] border-transparent bg-[#F4F5F8] px-3 py-2 text-sm tracking-tight shadow-none transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[var(--apple-orange)] focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props} />
    )
  );
})
Input.displayName = "Input"

export { Input }