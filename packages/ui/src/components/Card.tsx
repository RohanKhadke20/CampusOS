import React from "react";
import { cn } from "../utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "interactive" | "highlight";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles = "rounded-xl transition-all duration-150";

    const variantStyles = {
      default:
        "bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[0_1px_2px_0_rgba(0,0,0,0.2)]",
      raised:
        "bg-[var(--surface-raised)] border border-[var(--border-subtle)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2)]",
      interactive:
        "bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-interactive)] hover:bg-[var(--surface-hover)] cursor-pointer shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]",
      highlight:
        "bg-[var(--surface)] border border-[var(--brand-indigo)] shadow-[0_0_20px_-5px_rgba(99,102,241,0.25)]",
    };

    return (
      <div ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-4 sm:p-5 border-b border-[var(--border-subtle)]", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-[15px] font-semibold tracking-tight text-[var(--text-primary)]", className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-[var(--text-muted)]", className)} {...props}>
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 sm:p-5", className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-4 sm:p-5 border-t border-[var(--border-subtle)]", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
