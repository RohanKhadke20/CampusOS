import React from "react";
import { cn } from "../utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, disabled, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-[var(--text-muted)] flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-9 rounded-lg bg-[var(--canvas)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] border border-[var(--border-subtle)] focus:border-[var(--brand-indigo)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-indigo)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              error && "border-[var(--status-critical)] focus:border-[var(--status-critical)] focus-visible:ring-[var(--status-critical)]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[var(--text-muted)] flex items-center">
              {rightIcon}
            </div>
          )}
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
Input.displayName = "Input";
