import React from "react";
import { cn } from "../utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, disabled, children, ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-9 appearance-none rounded-lg bg-[var(--canvas)] text-[var(--text-primary)] text-xs border border-[var(--border-subtle)] pl-3 pr-8 focus:border-[var(--brand-indigo)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-indigo)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-[var(--status-critical)]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-[var(--text-muted)] flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="text-[11px] text-[var(--status-critical)] font-medium">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-[11px] text-[var(--text-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
