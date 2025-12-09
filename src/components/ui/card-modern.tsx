import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: [
          "bg-white dark:bg-slate-800/50",
          "rounded-2xl",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm",
        ],
        elevated: [
          "bg-white dark:bg-slate-800/80",
          "rounded-2xl",
          "border-0",
          "shadow-lg",
          "backdrop-blur-sm",
        ],
        glass: [
          "rounded-2xl",
          "backdrop-blur-xl",
          "bg-white/70 dark:bg-slate-800/70",
          "border border-white/20 dark:border-slate-700/30",
          "shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30",
        ],
        gradient: [
          "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900",
          "rounded-2xl",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-md",
        ],
        interactive: [
          "bg-white dark:bg-slate-800/50",
          "rounded-2xl",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm",
          "cursor-pointer",
          "hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-600/50",
          "active:scale-[0.98]",
        ],
        streak: [
          "bg-gradient-to-br from-amber-50 via-orange-50 to-red-50",
          "dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30",
          "rounded-2xl",
          "border border-orange-200/50 dark:border-orange-800/30",
          "shadow-lg shadow-orange-200/30 dark:shadow-orange-900/20",
        ],
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        lg: "p-5",
        xl: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardModernProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const CardModern = React.forwardRef<HTMLDivElement, CardModernProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
);
CardModern.displayName = "CardModern";

const CardModernHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardModernHeader.displayName = "CardModernHeader";

const CardModernTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
CardModernTitle.displayName = "CardModernTitle";

const CardModernDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-600 dark:text-slate-400", className)}
    {...props}
  />
));
CardModernDescription.displayName = "CardModernDescription";

const CardModernContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardModernContent.displayName = "CardModernContent";

const CardModernFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-3", className)}
    {...props}
  />
));
CardModernFooter.displayName = "CardModernFooter";

export {
  CardModern,
  CardModernHeader,
  CardModernTitle,
  CardModernDescription,
  CardModernContent,
  CardModernFooter,
  cardVariants,
};
