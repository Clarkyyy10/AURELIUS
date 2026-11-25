import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-sm border border-input bg-background px-3 py-2 text-base transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:border-dashed disabled:border-grey-300 disabled:text-grey-400 aria-invalid:border-2 aria-invalid:border-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
