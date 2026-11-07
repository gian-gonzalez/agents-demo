import * as React from "react";

import { cn } from "@/lib/utils";

/** Textarea Mango: mismo lenguaje que Input, crece con el contenido. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl bg-paper px-4 py-3 text-base text-ink leading-[1.45] ring-1 ring-line ring-inset transition-[box-shadow,background-color] duration-200 ease-settle outline-none placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:bg-sheet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        "aria-invalid:ring-chili aria-invalid:focus-visible:ring-chili",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
