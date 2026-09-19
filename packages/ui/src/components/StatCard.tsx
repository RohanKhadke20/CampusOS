import React from "react";
import { cn } from "../utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  variant?: "default" | "brand" | "success" | "warning" | "critical";
}

export const StatCard: React.FC<StatCardProps> = ({
  className,
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  ...props
}) => {
  const valueColorStyles = {
    default: "text-[var(--text-primary)]",
    brand: "text-[var(--brand-indigo)]",
    success: "text-[var(--status-success)]",
    warning: "text-[var(--status-warning)]",
    critical: "text-[var(--status-critical)]",
  };

  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] flex flex-col justify-between transition-all duration-150 hover:border-[var(--border-interactive)]",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--text-muted)]">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className={cn("text-2xl font-bold font-mono tracking-tight", valueColorStyles[variant])}>
          {value}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={cn(
                "text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded",
                trend.isNeutral
                  ? "bg-[var(--surface-raised)] text-[var(--text-muted)]"
                  : trend.isPositive
                  ? "bg-[var(--status-success-surface)] text-[var(--status-success)]"
                  : "bg-[var(--status-critical-surface)] text-[var(--status-critical)]"
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] text-[var(--text-muted)] truncate">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
};
