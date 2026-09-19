# CampusOS Security Architecture & Policies

## 1. Security Tenets
CampusOS adheres to defense-in-depth, zero-trust security principles designed to protect student personal data, financial transactions, OAuth credentials, and prevent prompt-injection attacks.

---

## 2. Threat Model & Mitigation Matrix

| Threat Surface | Potential Risk | Mitigation Mechanism |
| :--- | :--- | :--- |
| **OAuth Hijacking** | CSRF or state tampering during Google OAuth code exchange | Cryptographically secure random `state` parameter cached in httpOnly signed cookies with expiration. |
| **Token Theft** | Leakage of persistent Google refresh tokens via database breaches | Refresh tokens are encrypted at rest using AES-256-GCM with distinct initialization vectors (IVs) and authentication tags. |
| **Payment Fraud** | Fake payment responses bypassing client-side callback | Server-side HMAC-SHA256 signature verification over `order_id + "|" + payment_id` against `RAZORPAY_KEY_SECRET`. Webhooks validated via secret signature. |
| **Privilege Escalation**| Normal students performing organizer or admin actions | Enforced server-side Role-Based Access Control (RBAC) on every Server Action and API route using Zod-validated session contexts. |
| **AI Prompt Injection** | Untrusted event descriptions or student chats manipulating the agent into rogue tool execution | Strict tool schema definition via Zod, system prompt isolation, and compulsory Human-In-The-Loop confirmation on mutating actions. |
| **Data Scraping / DoS** | Abuse of expensive LLM endpoints | Per-user rate limiting (token-bucket) backed by memory or Redis. |
| **Audit Tampering** | Malicious users hiding deletions or permission escalations | Append-only `audit_logs` table with actor context, timestamp, IP, user-agent, and JSON change diffs. |

---

## 3. Token Encryption & Cryptographic Standards
All stored third-party credentials (e.g. Google OAuth refresh tokens) utilize the Node.js native `crypto` module:
- **Algorithm**: `aes-256-gcm`
- **Key Derivation**: 32-byte secret key derived from `ENCRYPTION_SECRET` or fallback key in demo mode.
- **Storage Format**: `iv.authTag.encryptedData` (Hex-encoded).

---

## 4. Role-Based Access Control (RBAC) Matrix

| Entity / Action | STUDENT | ORGANIZER | ADMIN |
| :--- | :---: | :---: | :---: |
| Browse Events & Clubs | Read | Read | Read |
| Register / Buy Tickets | Create (Self) | Create (Self) | Full |
| Create / Edit Events | - | Create / Edit (Own Org) | Full |
| Manage Resources & Labs | Book | Book / Approve Org | Full |
| View System Health & Audit | - | - | Full |
| Modify User Roles | - | - | Full |
| Run Read-Only AI Tools | Allowed | Allowed | Allowed |
| Run Mutating AI Tools | With Confirmation | With Confirmation | With Confirmation |

---

## 5. Razorpay Signature Verification Algorithm

```typescript
import { createHmac } from "crypto";

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const generated = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return generated === signature;
}
```

---

## 6. AI Agent Safety & Human-In-The-Loop (HITL) Guardrails
1. **Read-Only Tools**: (`list_upcoming_events`, `get_today_schedule`, `get_user_tasks`, `search_campus_events`) execute autonomously.
2. **Mutating Tools**: (`create_calendar_event`, `create_drive_file`, `send_event_confirmation`, `reserve_lab_slot`, `initiate_refund`) CANNOT be executed directly by the LLM. Instead, the model outputs an `ActionProposal` which generates a high-contrast confirmation modal in the client UI. Execution occurs strictly upon explicit user interaction.
