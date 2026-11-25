import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// Variants are the status classes of DESIGN.md section 11 and docs/12 section
// 2.3. The interface has no color, so each class differs in border style,
// weight, fill and icon. The label text always carries the meaning. The
// `stopped` class has three sub-treatments: rejected, cancelled and expired.
// Radius is 2 px (not a pill). Call sites never pass className to change these.
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 leading-snug transition-colors [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border border-grey-500 bg-white font-medium text-foreground",
        progress: "border border-black bg-grey-100 font-medium text-foreground",
        pending:
          "border border-dashed border-black bg-white font-medium text-foreground",
        complete: "border border-black bg-black font-semibold text-white",
        attention:
          "border-2 border-black bg-white font-semibold text-foreground",
        rejected:
          "status-hatch border-[3px] border-double border-black font-semibold text-foreground",
        cancelled:
          "status-hatch border-2 border-black font-semibold text-foreground",
        expired:
          "border border-dotted border-grey-600 bg-grey-100 font-medium text-grey-600",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
);

function Badge({
  className,
  variant = "neutral",
  size = "md",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
