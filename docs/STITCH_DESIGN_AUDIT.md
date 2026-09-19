# Stitch UI Design Audit: CampusOS University Operating System (`6222899932824695913`)

## 1. Executive Summary
This document audits the design language, token taxonomy, component anatomy, typography scale, and responsive behavior exported from Google Stitch Project `6222899932824695913` (30 screens covering Student, Organizer, Admin, AI Copilot, and Security Forensics).

Our objective is to **faithfully preserve the Stitch design language** across both Dark and Light modes while replacing hardcoded, generated mock markup with real, typed React components backed by the `@campusos/core` and `@campusos/db` domain layers.

---

## 2. Design Tokens & Color Palette

### 2.1 Color Matrix
The Stitch design system utilizes high-contrast semantic color pairings:

| Token Name | Light Mode Value | Dark Mode Value | Usage / Semantic |
| :--- | :--- | :--- | :--- |
| **Canvas / Background** | `#F8FAFC` (Slate-50) | `#090D16` | Root document canvas |
| **Surface / Card** | `#FFFFFF` | `#111827` / `#161B22` | Card containers, panels, modals |
| **Surface Raised** | `#F1F5F9` (Slate-100) | `#1E293B` | Table headers, chip backgrounds, nested cards |
| **Border Subtle** | `#E2E8F0` (Slate-200) | `#1E293B` | Divider lines, card boundaries |
| **Border Interactive** | `#CBD5E1` (Slate-300) | `#334155` | Buttons, inputs, interactive focus rings |
| **Text Primary** | `#0F172A` (Slate-900) | `#F8FAFC` | Primary headlines, metric numbers |
| **Text Secondary** | `#475569` (Slate-600) | `#94A3B8` | Body text, table descriptions |
| **Text Muted** | `#64748B` (Slate-500) | `#64748B` | Timestamps, secondary labels, icons |
| **Brand Primary (Indigo)** | `#4F46E5` | `#6366F1` | Primary action buttons, active navigation, AI accents |
| **Brand Hover** | `#4338CA` | `#4F46E5` | Button hover states |
| **Status Success** | `#059669` (Emerald) | `#34D399` | 94%+ Attendance, verified badges, active BLE |
| **Status Warning** | `#D97706` (Amber) | `#FBBF24` | Lab deadlines, attendance warnings, pending tasks |
| **Status Critical / SOS** | `#DC2626` (Red) | `#F87171` | Overdue assignments, critical audit events, SOS button |

---

## 3. Typography Hierarchy
Stitch employs the **Inter** typeface paired with **Material Symbols Outlined** icon sets.

| Level | Size / Line-Height | Weight | Letter Spacing | CSS Utility / Token |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 36px / 44px | 600 (Semibold) | `-0.025em` | `font-display` |
| **Headline LG** | 28px / 36px | 600 (Semibold) | `-0.02em` | `font-headline-lg` |
| **Headline MD** | 20px / 26px | 600 (Semibold) | `-0.015em` | `font-headline-md` |
| **Headline SM** | 15px / 22px | 600 (Semibold) | `-0.01em` | `font-headline-sm` |
| **Metric Num** | 24px / 28px | 700 (Bold) | `-0.02em` | `font-metric-num` |
| **Body LG** | 16px / 24px | 400 (Regular) | `-0.005em` | `font-body-lg` |
| **Body MD** | 14px / 20px | 400 (Regular) | `0em` | `font-body-md` |
| **Body SM** | 12px / 16px | 400 (Regular) | `0em` | `font-body-sm` |
| **Label MD** | 13px / 18px | 500 (Medium) | `0em` | `font-label-md` |
| **Label SM** | 11px / 14px | 600 (Semibold) | `0.03em` | `font-label-sm` (uppercase) |

---

## 4. Layout Architecture & Spacing
- **Top Header Bar**: Fixed `h-16` (64px) banner featuring campus logo, academic term indicator (`Fall 2025 • Week 7`), global command bar (`⌘K`), emergency SOS trigger, Copilot pill (`Ask Copilot ✦`), and user avatar with live status dot.
- **Left Navigation Sidebar**: Fixed `w-64` (256px) column grouping items into four distinct categorical sections:
  1. *Overview*: Dashboard, AI Assistant
  2. *Academics*: Timetable, Attendance, Assignments & Tasks, Course Vault
  3. *Life & Events*: Events Discovery, My Calendar, Clubs & Orgs, Campus Map
  4. *Governance*: Organizer Hub, Admin Command, Audit Logs
- **Main Canvas Grid**:
  - Top context ribbon & greeting
  - 4-column KPI metric summary row
  - 12-column asymmetric split:
    - **8 columns (Primary Workspace)**: AI observation callout banner, dynamic academic timeline, enrolled courses table, urgent deliverables taskboard.
    - **4 columns (Quick Operations & Feeds)**: Fast student actions (QR code modal trigger, Room booking, Canteen pre-order), campus event radar, club dispatch feed, node telemetry status.

---

## 5. Identified Design Inconsistencies to Address During Integration
1. **Raw Images & Unsafe Inline URLs**: The raw HTML export contains hardcoded `https://lh3.googleusercontent.com/...` test avatars and placeholder images that can break if links expire. These must be replaced with robust avatar and image fallbacks.
2. **Duplicated HTML Blocks**: The Stitch export duplicates identical sidebar and header structures in each of the 30 HTML screens. We extract these into a single shared `<StitchShell>` layout component.
3. **Hardcoded Scripts & Modals**: The exported QR modal and Bluetooth simulation use vanilla DOM queries (`document.getElementById`). These must be converted to reactive React state hooks within modular components.
4. **Icons**: Stitch uses Google Material Symbols (`<span class="material-symbols-outlined">`). We link the official Google Font stylesheet in `app/layout.tsx` so all Stitch icon glyphs render cleanly.
