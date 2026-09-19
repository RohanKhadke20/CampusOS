# CampusOS Deployment Guide

This guide covers production deployment configurations for CampusOS across containerized environments (Docker / Kubernetes) and serverless platforms (Vercel / Supabase).

---

## 1. Environment Configuration

Copy `.env.example` to your production environment secrets manager and populate the variables:

```bash
# Supabase PostgreSQL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Workspace OAuth & APIs
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://your-campus-domain.edu/api/google/oauth/callback

# Google Gemini GenAI
GEMINI_API_KEY=AIzaSy...

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Security & Encryption (AES-256-GCM)
ENCRYPTION_SECRET=32_character_cryptographically_secure_hex_key

# MCP Server
MCP_AUTH_SECRET=secure_shared_mcp_token
```

---

## 2. Vercel Deployment (Web Application)

1. Connect the repository `https://github.com/RohanKhadke20/CampusOS` to Vercel.
2. Configure project root directory to `apps/web`.
3. In Project Settings -> Build & Development Settings:
   - **Root Directory**: `.`
   - **Build Command**: `npm run build --workspace=@campusos/web`
   - **Output Directory**: `apps/web/.next`
4. Add environment variables in Vercel project settings.
5. Deploy.

---

## 3. MCP Server Standalone Deployment

The Model Context Protocol server can run as a persistent container or background process:

```bash
cd apps/mcp
npm run build
node dist/index.js
```

Or connect it to Claude Desktop by registering it in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "campusos": {
      "command": "node",
      "args": ["/path/to/CampusOS/apps/mcp/dist/index.js"],
      "env": {
        "CAMPUSOS_API_URL": "https://your-campus-domain.edu",
        "CAMPUSOS_MCP_SECRET": "your_mcp_secret"
      }
    }
  }
}
```

---

## 4. Health & Observability Verification

After deployment, verify that all external services report healthy status:

```bash
curl -i https://your-campus-domain.edu/api/health
```
