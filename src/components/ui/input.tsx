import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

// DESIGN.md section 13: white fill, 1 px grey-500 border, 2 px radius, 44 px
// high, 16 px text. Error state (aria-invalid): 2 px solid black border.
// Disabled: grey-400 text and a dashed grey-300 border.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-input bg-background px-3 py-2 text-base transition-colors file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-dashed disabled:border-grey-300 disabled:text-grey-400 aria-invalid:border-2 aria-invalid:border-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
