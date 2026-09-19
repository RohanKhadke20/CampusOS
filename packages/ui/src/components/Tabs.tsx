import React from "react";
import { cn } from "../utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className,
  size = "sm",
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] gap-1",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-indigo)]",
              size === "sm" ? "px-2.5 py-1 text-xs gap-1.5" : "px-3 py-1.5 text-xs gap-2",
              isActive
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]/50"
            )}
          >
            {item.icon && <span className="inline-flex shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-[var(--surface-raised)] text-[var(--text-secondary)]"
                    : "bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
