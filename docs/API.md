# CampusOS API Specification

## 1. Overview & Protocol
CampusOS exposes a unified API architecture utilizing:
- **Next.js App Router Server Actions** for internal mutations and client components with built-in CSRF token protection and optimistic execution.
- **RESTful Endpoints (`/api/*`)** for webhooks, external integrations, integration health monitoring, and headless workflows.
- **Model Context Protocol (MCP)** for AI agent tool execution via stdio and SSE.

All payloads are strictly validated using **Zod** schemas. Requests failing validation return an RFC 7807 compliant problem response with HTTP 422.

---

## 2. Authentication & Session Handling
- Session tokens are validated via Supabase Auth JWT headers or httpOnly secure session cookies.
- Server actions verify caller identity and role (`STUDENT`, `ORGANIZER`, `ADMIN`) via `requireAuth(session)` and `requireRole(role)`.
- When in **Demo Mode**, the mock session manager provides instant zero-credential persona switching between Student, Organizer, and Admin personas.

---

## 3. Endpoints Matrix

### 3.1 Health & Observability
- **`GET /api/health`**
  - **Description**: Returns overall system status, database connectivity, and connection status for each integration (Google, Gemini, Razorpay, MCP).
  - **Response 200**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-09-19T12:00:00Z",
      "demoMode": true,
      "services": {
        "database": { "status": "demo_fallback", "latencyMs": 1 },
        "gemini": { "status": "demo_fallback", "latencyMs": 0 },
        "googleWorkspace": { "status": "demo_fallback", "connected": false },
        "razorpay": { "status": "demo_fallback", "testMode": true },
        "mcp": { "status": "active", "toolsRegistered": 8 }
      }
    }
    ```

### 3.2 Events & Tickets
- **`GET /api/events`**: Query events with filters (`category`, `upcoming`, `orgId`, `search`).
- **`POST /api/events`**: Create event (Requires `ORGANIZER` or `ADMIN`).
- **`POST /api/events/[id]/register`**: RSVP or initiate ticket checkout for an event.
- **`GET /api/events/[id]/tickets`**: List available ticket tiers and inventory.

### 3.3 Payments & Razorpay Integration
- **`POST /api/payments/create-order`**
  - **Payload**: `{ "ticketId": "uuid", "eventId": "uuid" }`
  - **Response 201**: `{ "orderId": "order_xyz123", "amount": 49900, "currency": "INR", "keyId": "rzp_..." }`
- **`POST /api/payments/verify`**
  - **Payload**: `{ "orderId": "order_xyz123", "paymentId": "pay_abc", "signature": "hex_sig" }`
  - **Action**: Verifies HMAC-SHA256 signature, transitions payment status to `CAPTURED`, issues registration ticket.
- **`POST /api/webhooks/razorpay`**
  - **Headers**: `X-Razorpay-Signature`
  - **Action**: Validates secret, idempotent event handling (`payment.captured`, `payment.failed`).

### 3.4 Google Workspace Integration
- **`GET /api/google/auth`**: Generates Google OAuth consent URL with CSRF state token and requested scopes (Calendar, Drive, Gmail).
- **`GET /api/google/oauth/callback`**: Exchanges code for tokens, encrypts refresh token with AES-256-GCM, stores in `google_connections`.
- **`POST /api/google/calendar/sync`**: Syncs registered events to student Google Calendar.
- **`GET /api/google/drive/materials`**: Fetches linked event syllabi and club documentation.

### 3.5 AI Assistant & Tool Execution
- **`POST /api/ai/chat`**
  - **Payload**: `{ "conversationId": "uuid", "message": "What labs are open this Friday?" }`
  - **Action**: Passes context through prompt guardrails, executes read-only tools or yields pending approval cards for mutating actions.
- **`POST /api/ai/actions/confirm`**
  - **Payload**: `{ "actionId": "uuid", "decision": "APPROVED" | "REJECTED" }`
  - **Action**: Executes mutating tool upon explicit human confirmation.

### 3.6 Admin & Audit
- **`GET /api/admin/users`**: List and filter all users.
- **`PATCH /api/admin/users/[id]/role`**: Update user role (Requires `ADMIN`).
- **`GET /api/admin/audit-logs`**: Paginated view of audit events with actor, action, and JSON diffs.
