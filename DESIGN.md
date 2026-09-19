# CampusOS Design System Specification

> **Version**: 1.0.0  
> **Origin**: Derived from Google Stitch Project `6222899932824695913` (*CampusOS University Operating System*)  
> **Status**: Production Reference Standard  
> **Scope**: Monorepo packages (`@campusos/ui`), Web Applications (`@campusos/web`), and MCP Surface Extensions  

---

## 1. Design Principles & Vision

CampusOS is a next-generation University Operating System engineered for students, faculty, club leads, and enterprise campus administrators. Its aesthetic balances **mission-critical observability**, **academic utility**, and **high-density data presentation**.

1. **High-Density Legibility**: Information hierarchy prioritizes immediate scanning. Metric cards, timetable rows, and forensic audit logs maximize screen efficiency without visual clutter.
2. **Deterministic Token Architecture**: Every color, border, radius, shadow, and transition maps to a semantic CSS custom property. No arbitrary inline values (`p-[17px]`, `#123456`) are allowed.
3. **Dual-Theme Parity**: Complete optical calibration between Dark Mode (deep space `#090D16` canvas) and Light Mode (crisp porcelain `#F8FAFC` canvas).
4. **Accessible by Construction**: Strict adherence to WCAG 2.1 AA standards for color contrast, keyboard navigable focus rings, and screen-reader semantics.

---

## 2. Color System

### 2.1 Semantic Token Architecture

The token system employs a 2-tier architecture:
- **Primitive Scale**: Base neutral (Slate) and accent ramps (Indigo, Emerald, Amber, Rose, Sky).
- **Semantic Mapping**: Contextual tokens that automatically resolve depending on `data-theme="dark"` (default) or `data-theme="light"`.

| Semantic Token | Dark Mode (`[data-theme="dark"]`) | Light Mode (`[data-theme="light"]`) | Usage / Semantic Role |
| :--- | :--- | :--- | :--- |
| `--canvas` | `#090D16` | `#F8FAFC` | Root canvas / viewport background |
| `--surface` | `#111827` | `#FFFFFF` | Primary container surface (cards, panels, sidebars) |
| `--surface-raised` | `#1E293B` | `#F1F5F9` | Secondary surface (table headers, chips, inset wells) |
| `--surface-hover` | `#283548` | `#E2E8F0` | Interactive row hover, button ghost hover |
| `--surface-glass` | `rgba(17, 24, 39, 0.85)` | `rgba(255, 255, 255, 0.85)` | Sticky header bar, backdrop overlays |
| `--border-subtle` | `#1E293B` | `#E2E8F0` | Default card boundaries, table cell dividers |
| `--border-interactive` | `#334155` | `#CBD5E1` | Inputs, interactive buttons, modal frames |
| `--text-primary` | `#F8FAFC` | `#0F172A` | Major titles, metric values, high-emphasis text |
| `--text-secondary` | `#94A3B8` | `#475569` | Body paragraphs, descriptions, secondary data |
| `--text-muted` | `#64748B` | `#64748B` | Timestamps, table column labels, disabled text |
| `--brand-indigo` | `#6366F1` | `#4F46E5` | Primary action buttons, active navigation, key accents |
| `--brand-indigo-hover` | `#4F46E5` | `#4338CA` | Hover and active states for primary brand elements |
| `--brand-indigo-subtle`| `rgba(99, 102, 241, 0.15)` | `rgba(79, 70, 229, 0.08)` | Active tab pills, badge backgrounds |

### 2.2 Status & Feedback Palettes

Status colors convey critical campus states (attendance eligibility, deadlines, system alerts):

| Intent | Semantic Token | Dark Mode Fill / Border | Light Mode Fill / Border | Context / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `--status-success` | `#34D399`<br>`rgba(16, 185, 129, 0.12)` / `rgba(16, 185, 129, 0.25)` | `#059669`<br>`#ECFDF5` / `#A7F3D0` | Attendance ≥85%, registered badges, active BLE beacon |
| **Warning** | `--status-warning` | `#FBBF24`<br>`rgba(245, 158, 11, 0.12)` / `rgba(245, 158, 11, 0.25)` | `#D97706`<br>`#FFFBEB` / `#FDE68A` | Attendance 75–84%, lab deadlines within 24h, pending approval |
| **Critical** | `--status-critical`| `#F87171`<br>`rgba(239, 68, 68, 0.12)` / `rgba(239, 68, 68, 0.25)` | `#DC2626`<br>`#FEF2F2` / `#FECACA` | Attendance <75%, overdue assignments, SOS emergency, security breaches |
| **Info / AI**| `--status-info` | `#38BDF8`<br>`rgba(56, 189, 248, 0.12)` / `rgba(56, 189, 248, 0.25)` | `#0284C7`<br>`#F0F9FF` / `#BAE6FD` | AI observations, upcoming timetable shifts, system notes |

---

## 3. Typography Hierarchy

### 3.1 Typefaces
- **Primary Interface**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Telemetry & Monospace**: `JetBrains Mono, Menlo, Monaco, Consolas, monospace`
- **Iconography**: `Material Symbols Outlined` (Google Fonts, 20px optical size, weight 400) alongside `lucide-react` for component primitives.

### 3.2 Type Scale Specification

| Level | Size (px / rem) | Line Height | Weight | Letter Spacing | CSS Utility / Token | Example Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px / 2.25rem | 44px (1.22) | 700 (Bold) | `-0.025em` | `text-3xl font-bold tracking-tight` | Landing hero, major analytics callout |
| **Headline LG** | 28px / 1.75rem | 36px (1.28) | 600 (Semibold) | `-0.02em` | `text-2xl font-semibold tracking-tight` | Module headers, primary page titles |
| **Headline MD** | 20px / 1.25rem | 28px (1.40) | 600 (Semibold) | `-0.015em` | `text-xl font-semibold tracking-tight` | Section headers, card group titles |
| **Headline SM** | 15px / 0.9375rem | 22px (1.46) | 600 (Semibold) | `-0.01em` | `text-[15px] font-semibold` | Card header, sub-panel titles |
| **Metric Num** | 24px / 1.5rem | 28px (1.16) | 700 (Bold) | `-0.02em` | `text-2xl font-bold font-mono` | Attendance percentage, GPA, balance |
| **Body LG** | 16px / 1.0rem | 24px (1.50) | 400 (Regular) | `-0.005em` | `text-base` | AI assistant answers, articles |
| **Body MD** | 14px / 0.875rem | 20px (1.42) | 400 (Regular) | `0em` | `text-sm` | Default application body text |
| **Body SM** | 12px / 0.75rem | 16px (1.33) | 400 (Regular) | `0em` | `text-xs` | Metadata, timestamps, helper descriptions |
| **Label MD** | 13px / 0.8125rem | 18px (1.38) | 500 (Medium) | `0em` | `text-[13px] font-medium` | Form labels, button text, table cells |
| **Label SM** | 11px / 0.6875rem | 14px (1.27) | 600 (Semibold) | `0.03em` | `text-[11px] font-semibold uppercase` | Table column headers, badge tags |

---

## 4. Spacing Scale

The spacing system is rooted in a strict **4px baseline grid**. Components and layouts must strictly consume standardized spacing increments:

| Token | Pixels | Rem Value | Tailwind Class | Semantic Application |
| :--- | :--- | :--- | :--- | :--- |
| `space-0.5` | 2px | 0.125rem | `gap-0.5`, `p-0.5` | Micro-badges, inline dot offsets |
| `space-1` | 4px | 0.25rem | `gap-1`, `p-1` | Tight icon-to-label spacing, compact chips |
| `space-1.5` | 6px | 0.375rem | `gap-1.5`, `py-1.5` | Standard button vertical padding, table row tight gap |
| `space-2` | 8px | 0.5rem | `gap-2`, `p-2` | Form control padding, list item gaps |
| `space-3` | 12px | 0.75rem | `gap-3`, `p-3` | Button horizontal padding (`px-3`), card inner gutters |
| `space-4` | 16px | 1.0rem | `gap-4`, `p-4` | Standard card padding, grid gutter default |
| `space-5` | 20px | 1.25rem | `gap-5`, `p-5` | Feature card inner padding, panel header spacing |
| `space-6` | 24px | 1.5rem | `gap-6`, `p-6` | Large container padding, section vertical gutters |
| `space-8` | 32px | 2.0rem | `gap-8`, `p-8` | Page layout margins, major section dividers |
| `space-10` | 40px | 2.5rem | `gap-10`, `p-10`| Hero section vertical padding |
| `space-12` | 48px | 3.0rem | `gap-12`, `p-12`| Empty state hero blocks |
| `space-16` | 64px | 4.0rem | `gap-16`, `p-16`| Top navigation fixed height (`h-16`) |

> **Rule**: No arbitrary pixel values (e.g., `margin: 17px;`) are permitted.

---

## 5. Radii Scale

CampusOS embraces a clean, architectural geometry with precise, restrained border radiuses:

| Token | Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| `radius-none` | `0px` | `rounded-none` | Full-bleed dividers, tabular grid edges |
| `radius-xs` | `2px` | `rounded-[2px]` | Progress bar fill tracks, miniature indicators |
| `radius-sm` | `4px` / `0.25rem` | `rounded` | Code snippets, compact table badges, tooltips |
| `radius-md` | `8px` / `0.5rem` | `rounded-lg` | Input elements, action buttons, dropdown items, filter tabs |
| `radius-lg` | `12px` / `0.75rem` | `rounded-xl` | Standard cards, data tables, telemetry panels |
| `radius-xl` | `16px` / `1.0rem` | `rounded-2xl` | Modal dialogs, AI prompt surfaces, hero banners |
| `radius-full` | `9999px` | `rounded-full` | Status dots, avatars, SOS emergency button, pill chips |

---

## 6. Shadows & Elevation

Elevations are tailored specifically for high-contrast dark surfaces with complementary light-mode drop shadows:

| Elevation Level | Dark Mode Specification | Light Mode Specification | Application |
| :--- | :--- | :--- | :--- |
| **Level 0 (Flat)** | `none`, 1px border `var(--border-subtle)` | `none`, 1px border `var(--border-subtle)` | Inset wells, table rows, flat cards |
| **Level 1 (Subtle)** | `0 1px 2px 0 rgba(0, 0, 0, 0.4)` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Interactive buttons, filter pills |
| **Level 2 (Card)** | `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)` | `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)` | Standard dashboard cards, hover states |
| **Level 3 (Floating)** | `0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)` | `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)` | Dropdown menus, popovers, flyout drawers |
| **Level 4 (Modal)** | `0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)` | `0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)` | Modal dialogs, command palette (`⌘K`) |
| **Brand Glow** | `0 0 20px -5px rgba(99, 102, 241, 0.3)` | `0 0 15px -3px rgba(79, 70, 229, 0.2)` | Primary CTA focus, AI Copilot active beacon |
| **Critical Glow** | `0 0 24px 0 rgba(239, 68, 68, 0.45)` | `0 0 20px 0 rgba(220, 38, 38, 0.3)` | SOS emergency active trigger |

---

## 7. Transitions & Motion

CampusOS employs subtle, high-performance CSS transitions designed to never delay user interaction:

| Property | Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Duration Fast** | `150ms` | `duration-150` | Button hover, tab switch, checkbox check |
| **Duration Normal** | `200ms` | `duration-200` | Card expansion, dropdown open, modal fade |
| **Duration Slow** | `300ms` | `duration-300` | Sidebar toggle, drawer slide-out |
| **Timing Function** | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | Standard acceleration/deceleration |
| **Properties** | `color, background-color, border-color, box-shadow, transform` | `transition-all` | Standard interactive state transitions |

### Reduced Motion
All animations honor user accessibility preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Component States

Every interactive element specifies predictable visual states:

1. **Default**:
   - Background: `var(--surface)` or `transparent`
   - Border: `var(--border-subtle)`
   - Text: `var(--text-primary)`
2. **Hover**:
   - Background: `var(--surface-hover)`
   - Border: `var(--border-interactive)`
   - Transition: `150ms ease-in-out`
3. **Active (Pressed)**:
   - Transform: `scale(0.98)` or inset shadow
   - Background: darkened surface
4. **Focus-Visible**:
   - Outline: `none`
   - Ring: `2px solid var(--brand-indigo)`
   - Ring Offset: `2px solid var(--canvas)`
5. **Disabled**:
   - Opacity: `0.5`
   - Cursor: `not-allowed`
   - Pointer Events: `none`
6. **Loading**:
   - Animated SVG spinner or skeleton pulse (`animate-pulse`)
   - Text remains accessible or replaced by `aria-live="polite"` status message

---

## 9. Accessibility Rules (a11y)

1. **Color Contrast (WCAG 2.1 AA)**:
   - Body text against canvas/surface must exceed **4.5:1**.
   - Large headlines (≥24px or ≥18.5px bold) must exceed **3.0:1**.
   - Interactive boundaries and icons must exceed **3.0:1** against adjacent backgrounds.
2. **Focus Rings**:
   - All interactive elements must exhibit visible focus styling via `:focus-visible`. Default browser outlines are replaced with calibrated dual-ring tokens (`ring-2 ring-[var(--brand-indigo)] ring-offset-2 ring-offset-[var(--canvas)]`).
3. **Modal & Dialog Focus Trap**:
   - Opening a modal locks keyboard focus within the dialog.
   - Hitting `Escape` closes active modal dialogs.
   - Focus returns to the triggering element upon dismissal.
4. **Touch Target Size**:
   - Interactive components maintain a minimum bounding box of **44 × 44px** on touch viewports (`< 768px`).
5. **Screen Reader Semantics**:
   - All icon-only buttons include descriptive `aria-label` or visually hidden `.sr-only` text.
   - Status indicators utilize `role="status"` or `aria-live="polite"`.

---

## 10. Responsive Breakpoints

CampusOS adapts fluidly from handheld student mobile views to wide multi-monitor faculty workstations:

| Breakpoint | Minimum Width | Layout Strategy |
| :--- | :--- | :--- |
| **`sm`** | `640px` | 1-column mobile feed; horizontal scroll for wide tables; bottom navigation bar |
| **`md`** | `768px` | 2-column metric grid; collapsed icon sidebar; visible action buttons |
| **`lg`** | `1024px` | Full 256px persistent sidebar; 3-column metric cards; modal dialogs centered |
| **`xl`** | `1280px` | 4-column metric grid; 12-column asymmetric desktop workspace (8 cols workspace + 4 cols operations) |
| **`2xl`** | `1536px` | Max-width bounded content container (`max-w-[1600px] mx-auto`); extended forensic log view |

---

## 11. Reusable UI Primitives Reference

The `@campusos/ui` package and `@campusos/web` components provide these canonical primitives:

1. **`<Button>`**: Primary, Secondary, Outline, Ghost, Danger, Success. Supports `size="xs"|"sm"|"md"|"lg"`, `isLoading`, and icon slots.
2. **`<Badge>`**: Semantic tags (`success`, `warning`, `critical`, `info`, `brand`, `neutral`) with optional live status dot.
3. **`<Card>`**, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`: Modular card system with `variant="default"|"raised"|"interactive"|"highlight"`.
4. **`<Modal>`**: Accessible dialog with backdrop blur, focus trap, and Escape key dismissal.
5. **`<Input>`**: Inset field with optional left/right icon slots, clear button, and error message text.
6. **`<Select>`**: Styled dropdown selector matching input geometry.
7. **`<StatCard>`**: Standardized KPI tile displaying title, metric number, trend indicator, and helper text.
8. **`<Table>`**, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`: High-density data grid with uppercase subheaders and row hover highlights.
9. **`<Tabs>`** / `<SegmentedControl>`: Standardized filter switcher with subtle active indicator.
10. **`<Skeleton>`**: Shimmer placeholder for async data hydration.
