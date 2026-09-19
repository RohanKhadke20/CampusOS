import React from "react";
import { cn } from "../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "critical" | "info" | "brand" | "neutral";
  size?: "sm" | "md";
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "sm",
  withDot = false,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full border transition-colors select-none";

  const variantStyles = {
    success:
      "bg-[var(--status-success-surface)] text-[var(--status-success)] border-[var(--status-success-border)]",
    warning:
      "bg-[var(--status-warning-surface)] text-[var(--status-warning)] border-[var(--status-warning-border)]",
    critical:
      "bg-[var(--status-critical-surface)] text-[var(--status-critical)] border-[var(--status-critical-border)]",
    info:
      "bg-[var(--status-info-surface)] text-[var(--status-info)] border-[var(--status-info-border)]",
    brand:
      "bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)] border-[var(--brand-indigo-subtle)]",
    neutral:
      "bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
  };

  const dotStyles = {
    success: "bg-[var(--status-success)]",
    warning: "bg-[var(--status-warning)]",
    critical: "bg-[var(--status-critical)]",
    info: "bg-[var(--status-info)]",
    brand: "bg-[var(--brand-indigo)]",
    neutral: "bg-[var(--text-muted)]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-2",
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {withDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
