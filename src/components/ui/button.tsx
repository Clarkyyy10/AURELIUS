import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// DESIGN.md sections 6 and 13: 44 px default, 52 px for the main call to
// action, 36 px compact (dense owner tables on desktop only), 2 px radius.
// Focus is the global :focus-visible rule in globals.css.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-base font-medium whitespace-nowrap transition-colors select-none active:not-aria-[haspopup]:inset-shadow-[0_0_0_1px_var(--color-grey-600)] disabled:pointer-events-none disabled:border-dashed disabled:border-grey-300 disabled:bg-white disabled:text-grey-400 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-active active:bg-primary-active",
        outline:
          "border-foreground bg-background text-foreground hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-grey-200 aria-expanded:bg-secondary",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        // A destructive action is an outline button with a trash icon and the
        // verb in the label, and it opens an AlertDialog (DESIGN.md section 12).
        destructive:
          "border-foreground bg-background text-foreground hover:bg-muted",
        link: "text-foreground underline underline-offset-4",
      },
      size: {
        default:
          "h-11 min-w-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-13 min-w-13 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        sm: "h-9 min-w-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-11",
        "icon-lg": "size-13",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
