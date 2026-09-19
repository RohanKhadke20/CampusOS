# CampusOS Model Context Protocol (MCP) Server

## 1. Overview & Protocol Standard
CampusOS includes a dedicated Model Context Protocol (MCP) server package conforming to the `@modelcontextprotocol/sdk` specification.

The MCP server enables external AI clients (such as Claude Desktop, Gemini agent runtimes, or CLI assistants) to safely query and interact with the CampusOS platform through standardized tool discovery and execution contracts.

---

## 2. Server Transports
1. **Standard I/O (`stdio`)**: Standard transport for local desktop assistants like Claude Desktop or terminal agents.
2. **Server-Sent Events (SSE / HTTP)**: Web transport mounted at `/api/mcp/sse` for remote micro-agents and internal web AI workflows.

---

## 3. Tool Definitions

The CampusOS MCP server provides 8 core tools divided into **Read-Only (Autonomous)** and **Mutating (Confirmation Required)**:

### 3.1 Read-Only Tools (Autonomous Execution)

#### 1. `list_upcoming_events`
- **Description**: List upcoming campus events filtered by time window, organization, or category.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "limit": { "type": "number", "default": 10 },
      "category": { "type": "string" },
      "upcomingOnly": { "type": "boolean", "default": true }
    }
  }
  ```

#### 2. `get_today_schedule`
- **Description**: Fetch the authenticated student's academic timetable and classes for the current day.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "userId": { "type": "string", "description": "Student UUID" }
    },
    "required": ["userId"]
  }
  ```

#### 3. `search_campus_events`
- **Description**: Perform full-text and semantic keyword search over published events, venues, and descriptions.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "query": { "type": "string" }
    },
    "required": ["query"]
  }
  ```

#### 4. `get_payment_status`
- **Description**: Retrieve current transaction status and registration badge for an event order.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "orderId": { "type": "string" }
    },
    "required": ["orderId"]
  }
  ```

#### 5. `get_user_tasks`
- **Description**: Fetch user task items, deadlines, and completion statuses.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "status": { "type": "string", "enum": ["TODO", "IN_PROGRESS", "DONE", "ALL"] }
    },
    "required": ["userId"]
  }
  ```

---

### 3.2 Mutating Tools (Require Explicit Human Confirmation)

#### 6. `create_calendar_event`
- **Description**: Creates or syncs an event to student Google Calendar / CampusOS calendar.
- **Mutating**: `true`
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "startTime": { "type": "string", "format": "date-time" },
      "endTime": { "type": "string", "format": "date-time" },
      "location": { "type": "string" },
      "description": { "type": "string" }
    },
    "required": ["title", "startTime", "endTime"]
  }
  ```

#### 7. `create_drive_file`
- **Description**: Uploads or links a document/syllabus to the campus Google Drive storage folder.
- **Mutating**: `true`
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "fileName": { "type": "string" },
      "content": { "type": "string" },
      "mimeType": { "type": "string" },
      "entityType": { "type": "string" }
    },
    "required": ["fileName", "content"]
  }
  ```

#### 8. `send_event_confirmation`
- **Description**: Dispatches an email confirmation and ticket badge to registered student via Gmail API.
- **Mutating**: `true`
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "recipientEmail": { "type": "string", "format": "email" },
      "eventId": { "type": "string" },
      "ticketNumber": { "type": "string" }
    },
    "required": ["recipientEmail", "eventId", "ticketNumber"]
  }
  ```

---

## 4. MCP Configuration Example (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "campusos": {
      "command": "node",
      "args": ["/path/to/CampusOS/apps/mcp/dist/index.js"],
      "env": {
        "CAMPUSOS_API_URL": "http://localhost:3000",
        "CAMPUSOS_MCP_SECRET": "demo-mcp-secret"
      }
    }
  }
}
```
