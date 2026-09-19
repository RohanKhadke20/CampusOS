import React from "react";
import { cn } from "../utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "brand-subtle";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variantStyles = {
      primary:
        "bg-[var(--brand-indigo)] hover:bg-[var(--brand-indigo-hover)] text-white shadow-sm border border-transparent",
      secondary:
        "bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-interactive)] shadow-sm",
      outline:
        "bg-transparent hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-interactive)]",
      ghost:
        "bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      danger:
        "bg-[var(--status-critical)] hover:opacity-90 text-white shadow-sm border border-transparent",
      success:
        "bg-[var(--status-success)] hover:opacity-90 text-white shadow-sm border border-transparent",
      "brand-subtle":
        "bg-[var(--brand-indigo-subtle)] hover:opacity-80 text-[var(--brand-indigo)] border border-[var(--brand-indigo-subtle)]",
    };

    const sizeStyles = {
      xs: "h-6 px-2 text-[11px] gap-1",
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-xs font-medium gap-2",
      lg: "h-11 px-5 text-sm gap-2.5",
      icon: "h-8 w-8 p-0 text-xs",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
