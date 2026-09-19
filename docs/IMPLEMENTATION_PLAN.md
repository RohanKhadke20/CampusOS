# CampusOS Implementation Plan

## 1. Executive Summary & Vision
CampusOS is an AI-native campus operating system designed for students, club leads, event organizers, faculty, and campus administrators. It unifies event management, ticketing, calendar sync, study tracking, resource bookings, administrative audit trails, Razorpay payments, and an autonomous AI agent with Model Context Protocol (MCP) server support.

This document outlines the systematic, phased implementation roadmap adhering to strict zero-regression, comprehensive testing, demo-mode fallback, and enterprise-grade security standards.

---

## 2. Monorepo Architecture & Package Strategy
The project follows an npm / pnpm workspace architecture structured as follows:

```
CampusOS/
├── apps/
│   ├── web/                     # Next.js App Router full-stack web application (Command-Center UI)
│   └── mcp/                     # Dedicated Model Context Protocol (MCP) Server (stdio & SSE/HTTP)
├── packages/
│   ├── core/                    # Domain models, Zod validation schemas, business logic, RBAC rules
│   ├── db/                      # Supabase / PostgreSQL schema, migrations, seed data, client wrapper
│   ├── integrations/            # Google (Calendar, Drive, Gmail, Maps), Razorpay SDK wrappers
│   ├── ai/                      # AI abstraction layer, Gemini 2.5/Flash provider, tools, guardrails
│   ├── ui/                      # Shared Tailwind & shadcn UI primitives, tokens, and visual components
│   └── config/                  # Shared ESLint, Prettier, TypeScript configs
├── docs/                        # Specifications, Architecture, Database, Security, API, MCP docs
└── scripts/                     # Seed scripts, migration runners, verification utilities
```

---

## 3. Phased Implementation Roadmap

### Phase 1: Architecture Discovery & Documentation (Current Phase)
- [x] Inspect existing workspace and requirements.
- [ ] Deliver comprehensive system architecture specification: `docs/ARCHITECTURE.md`.
- [ ] Deliver relational data model and migration definitions: `docs/DATABASE.md`.
- [ ] Deliver REST/Action API specification: `docs/API.md`.
- [ ] Deliver security, auth, encryption, and threat model: `docs/SECURITY.md`.
- [ ] Deliver Model Context Protocol specifications: `docs/MCP.md`.
- [ ] Establish step-by-step implementation plan: `docs/IMPLEMENTATION_PLAN.md`.

### Phase 2: Monorepo Foundation & Initial Skeleton
- [ ] Set up root monorepo configuration with npm workspaces (`apps/*`, `packages/*`).
- [ ] Structure `packages/core`:
  - Define role enums (`STUDENT`, `ORGANIZER`, `ADMIN`).
  - Base TypeScript interfaces and Zod schemas for all domain entities.
- [ ] Structure `packages/db`:
  - Supabase/PostgreSQL schema definitions and SQL migrations.
  - Demo-mode in-memory / seeded repository fallbacks.
- [ ] Structure `packages/ui`:
  - Design tokens, command-center dashboard styling, dark/light theme support.
  - Component library exports.
- [ ] Move and configure `apps/web`:
  - Next.js App Router setup with Tailwind CSS v4, Lucide icons, and navigation shell.
- [ ] Structure `apps/mcp`:
  - Initial TypeScript MCP server skeleton using `@modelcontextprotocol/sdk`.

### Phase 3: Core Domain & Data Layer (Relational + Demo Fallback)
- [ ] Implement database client and repository pattern across all 18 core tables:
  - Users, Profiles, Organizations, Memberships, Events, Tickets, Registrations, Payments, Tasks, Timetables, Attendance, Resources, Notifications, Google Connections, Calendar Events, Drive Files, AI Conversations/Messages/Actions, Audit Logs.
- [ ] Implement robust **Demo Mode**:
  - Automatically activates when Supabase or external credentials are empty or invalid.
  - Richly seeded realistic campus data (events, clubs, tasks, attendance, mock tickets).
  - Explicit UI banner and connection health indicator (Never silently fail).

### Phase 4: Modern Command-Center Web Application UI
- [ ] Global Layout & Navigation:
  - Responsive collapsible sidebar, Command-K palette, role switcher, theme toggle.
  - High-contrast, clean SaaS styling (no visual clutter, WCAG-conscious contrast).
- [ ] 14 Core Feature Modules:
  1. **Dashboard**: High-level telemetry, upcoming events, academic timetable widgets, quick actions.
  2. **Events**: Discovery, filtering, detail pages, organizer event creator wizard with AI assist.
  3. **Clubs / Organizations**: Student organizations directory, join requests, committee management.
  4. **Tasks**: Kanban/list view, priorities, due dates, course associations.
  5. **Timetable**: Weekly schedule grid, classroom locations, lecture tracking.
  6. **Attendance**: QR/code check-in simulator, attendance percentage tracking, eligibility alerts.
  7. **Resources**: Campus facility bookings (labs, auditorium, sports equipment) with slot reservations.
  8. **Calendar**: Monthly/weekly interactive calendar with local + Google Calendar overlay.
  9. **Payments**: Razorpay checkout integration, payment history, receipts, refund status.
  10. **Notifications**: In-app notification center, real-time alerts, email dispatch logs.
  11. **AI Assistant**: Persistent AI chat drawer/page, action confirmation dialogs, contextual campus tools.
  12. **Integrations**: Status dashboard for Google (Calendar, Drive, Gmail, Maps), Razorpay, and Gemini.
  13. **Admin**: User management, organization approvals, role assignments, system health.
  14. **Audit Logs**: Immutable timeline of all sensitive actions, actor, IP, timestamp, diff.

### Phase 5: Google Workspace & Services Integration Layer
- [ ] Secure OAuth2 flow with PKCE, state token verification, and refresh token AES-256-GCM encryption.
- [ ] Google Calendar integration (bidirectional event sync).
- [ ] Google Drive integration (permissioned syllabus/brochure storage and link generator).
- [ ] Gmail integration (transactional event confirmation templates and ticket dispatch).
- [ ] Google Maps integration (campus building geolocation and interactive venue picker).
- [ ] Graceful demo-mode mock fallback for all Google APIs when credentials are unconfigured.

### Phase 6: Razorpay Payment Processing & Webhooks
- [ ] Server-side order creation (`orders.create`) with currency and receipt validation.
- [ ] Client-side checkout modal integration with Razorpay Checkout.
- [ ] HMAC SHA256 signature verification for client payment response.
- [ ] Webhook endpoint `/api/webhooks/razorpay` with replay protection and signature validation.
- [ ] Idempotent transaction handling and audit logging.
- [ ] Demo payment simulator for instant zero-credential end-to-end testing.

### Phase 7: AI Service Layer & Guardrails
- [ ] Provider abstraction decoupling business logic from Google Gemini SDK.
- [ ] Structured prompt engineering & tools:
  - Event description generator.
  - Automatic study schedule builder based on syllabus & timetable.
  - Natural language campus database Q&A with strict context injection.
- [ ] Prompt injection defense (system prompt sandboxing, output parsing with Zod).
- [ ] Two-phase action execution: Read-only runs instantly; Mutating tools (e.g., booking, deleting, paying) mandate UI user confirmation.

### Phase 8: Model Context Protocol (MCP) Server
- [ ] Dedicated MCP server exposing tools:
  - `list_upcoming_events`
  - `get_today_schedule`
  - `create_calendar_event`
  - `create_drive_file`
  - `send_event_confirmation`
  - `search_campus_events`
  - `get_payment_status`
  - `get_user_tasks`
- [ ] Transport implementations: stdio and SSE/Stream for web agents.
- [ ] Authentication and token verification for MCP clients.

### Phase 9: Quality Assurance, Testing, Observability & CI/CD
- [ ] Unit & integration tests with Vitest (RBAC, Zod schemas, payment verification, AI parsers).
- [ ] Playwright E2E suites (Login, Dashboard, Event Registration, Payment Flow, AI Assistant, Admin controls).
- [ ] Structured JSON logging with request tracing.
- [ ] `/api/health` comprehensive integration diagnostics endpoint.
- [ ] GitHub Actions CI workflow (lint, test, build, typecheck).
- [ ] Complete documentation suite (`README.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`).

---

## 4. Verification & Quality Gates
Every phase strictly requires:
1. `npm run lint` passes without errors.
2. `npm run typecheck` passes with zero TypeScript errors.
3. Unit and integration tests pass.
4. Demo mode functions with zero external API credentials configured.
