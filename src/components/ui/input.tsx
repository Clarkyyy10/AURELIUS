import * as React from "react";
import { cn } from "@/lib/utils";

// DESIGN.md §13: white, 1 px grey-500 border, 2 px radius, 44 px high, 16 px text (no iOS zoom).
// Error: 2 px solid black border (the message below says "Error:").
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-input bg-white px-3 py-1 text-base transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-grey-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-dashed disabled:border-grey-300 disabled:text-grey-400 aria-invalid:border-2 aria-invalid:border-black",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
