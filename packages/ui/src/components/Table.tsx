import React from "react";
import { cn } from "../utils";

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
      <table ref={ref} className={cn("w-full text-left border-collapse", className)} {...props}>
        {children}
      </table>
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]", className)}
    {...props}
  >
    {children}
  </thead>
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => (
  <tbody ref={ref} className={cn("divide-y divide-[var(--border-subtle)]", className)} {...props}>
    {children}
  </tbody>
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition-colors hover:bg-[var(--surface-hover)] data-[state=selected]:bg-[var(--surface-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-left whitespace-nowrap",
      className
    )}
    {...props}
  >
    {children}
  </th>
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap", className)}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = "TableCell";
