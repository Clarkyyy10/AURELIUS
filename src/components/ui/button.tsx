import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

// docs/design/DESIGN.md §6 and §13: black primary, outline secondary with a black border, 44 px
// default height (52 px "lg" for the main call to action, 36 px "sm" only in dense owner screens),
// 2 px radius, dashed border when disabled. Focus is the global :focus-visible rule. "destructive" is
// an outline button too — the trash icon and the verb in the label say what it does (no red).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors duration-150 select-none active:not-aria-[haspopup]:inset-shadow-[0_0_0_1px_var(--grey-600)] disabled:pointer-events-none disabled:border-dashed disabled:border-grey-300 disabled:bg-white disabled:text-grey-400 aria-invalid:border-2 aria-invalid:border-black [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-active active:bg-primary-active",
        outline: "border-black bg-white text-black hover:bg-grey-100 aria-expanded:bg-grey-100",
        secondary: "bg-secondary text-secondary-foreground hover:bg-grey-200 aria-expanded:bg-secondary",
        ghost: "text-black hover:bg-grey-100 aria-expanded:bg-grey-100",
        destructive: "border-black bg-white text-black hover:bg-grey-100",
        link: "h-auto px-0 text-black underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "h-11 min-w-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 min-w-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-13 min-w-13 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-13",
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
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return <Comp data-slot="button" data-variant={variant} data-size={size} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
