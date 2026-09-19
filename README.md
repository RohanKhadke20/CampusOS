# CampusOS (AI-Native Campus Operating System)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)
[![MCP](https://img.shields.io/badge/MCP-Standard-purple)](https://modelcontextprotocol.io/)

CampusOS is a production-grade, AI-native campus operating system connecting students, student organizations, event planners, faculty, and university administration into a single unified platform.

---

## 🏛️ System Architecture & Monorepo Layout

```
CampusOS/
├── apps/
│   ├── web/                    # Next.js 16 App Router Command Center application
│   └── mcp/                    # Dedicated Model Context Protocol (MCP) Server
├── packages/
│   ├── core/                   # Shared TypeScript models, Zod validation schemas, RBAC rules
│   ├── db/                     # Supabase PostgreSQL client & in-memory seeded Demo DB engine
│   ├── integrations/           # Google Workspace (Calendar, Drive, Gmail, Maps) & Razorpay
│   ├── ai/                     # AI abstraction layer (Gemini 2.5/Flash + guardrails)
│   ├── ui/                     # Design tokens, theme variables, and shared UI primitives
│   └── config/                 # Monorepo configuration
├── docs/                       # Technical Specifications & Documentation Suite
│   ├── ARCHITECTURE.md         # System design and component diagrams
│   ├── DATABASE.md             # 19 normalized relational PostgreSQL tables & DDL
│   ├── API.md                  # REST, Server Actions, and /api/health contracts
│   ├── SECURITY.md             # RBAC matrix, token encryption, and audit policies
│   ├── MCP.md                  # Model Context Protocol tools & connection schemas
│   ├── IMPLEMENTATION_PLAN.md  # Detailed phased development roadmap
│   ├── DEPLOYMENT.md           # Cloud deployment instructions
│   └── CONTRIBUTING.md         # Developer contribution guidelines
└── scripts/                    # Database migrations and seed utilities
```

---

## 🚀 Key Modules & Capabilities

1. **Command-Center Dashboard**: Real-time telemetry, upcoming hackathons, academic timetable widgets, and quick-action shortcuts.
2. **Event Management & Ticketing**: Tiered tickets, RSVP tracking, QR check-in simulation, and Razorpay payment processing.
3. **Clubs & Societies**: Student organization directories, committee management, and club memberships.
4. **Attendance & Academics**: Timetable schedule matrix, course attendance eligibility tracking, and shortfall alerts.
5. **Campus Resources**: Real-time lab workstation, auditorium, and equipment reservations.
6. **Unified Calendar**: Bidirectional Google Calendar synchronization and local schedule overlay.
7. **AI Assistant & Agent Tools**: Natural language queries, automated study planning, event drafting, and human-in-the-loop tool approvals.
8. **Model Context Protocol (MCP) Server**: Exposes 8 standard tools for Claude Desktop and agent runtimes.
9. **Role-Based Access Control (RBAC)**: Strict student, organizer, and administrator permission enforcement.
10. **Immutable Audit Logs**: Comprehensive activity logging capturing actors, IP addresses, timestamps, and JSON diffs.

---

## 🛡️ Zero-Credential Demo Mode

CampusOS is designed to run seamlessly **out-of-the-box without requiring external credentials**:
- When Supabase, Google, Razorpay, or Gemini API keys are omitted, CampusOS automatically activates **Demo Mode**.
- The in-memory seeded repository simulates live campus data with pre-configured personas (`Student`, `Organizer`, `Admin`).
- Integration health and demo fallbacks can be inspected anytime at `/api/health`.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 2. Installation
```bash
git clone https://github.com/RohanKhadke20/CampusOS.git
cd CampusOS
npm install
```

### 3. Environment Setup (Optional for Live Mode)
```bash
cp .env.example .env.local
```
*(Leave empty or omitted to run in full Demo Mode)*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the CampusOS Command Center.

### 5. Type Checking & Verification
```bash
npm run typecheck
npm run lint
```

---

## 📜 Documentation Index
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Database Schema & Migrations](docs/DATABASE.md)
- [API Reference](docs/API.md)
- [Security & Compliance](docs/SECURITY.md)
- [Model Context Protocol (MCP) Guide](docs/MCP.md)
- [Phased Implementation Roadmap](docs/IMPLEMENTATION_PLAN.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
