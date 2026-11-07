import * as React from "react";

import { cn } from "@/lib/utils";

/** Input Mango: papel, hairline, 48px, texto 16; foco con anillo de tinta. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl bg-paper px-4 text-base text-ink tnum ring-1 ring-line ring-inset transition-[box-shadow,background-color] duration-200 ease-settle outline-none placeholder:text-ink-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-semibold file:text-ink file:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:bg-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        "aria-invalid:ring-chili aria-invalid:focus-visible:ring-chili",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
