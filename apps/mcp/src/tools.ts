// MCP Tool definitions and manifest (Phase 2 initial skeleton)

export const CAMPUSOS_MCP_TOOLS = [
  {
    name: "list_upcoming_events",
    description: "List upcoming campus hackathons, workshops, and cultural events.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 10 },
      },
    },
    isMutating: false,
  },
  {
    name: "get_today_schedule",
    description: "Fetch student timetable and classes for today.",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
      },
      required: ["userId"],
    },
    isMutating: false,
  },
  {
    name: "create_calendar_event",
    description: "Creates an event in the student's Google / CampusOS calendar. Requires confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        startTime: { type: "string" },
        endTime: { type: "string" },
      },
      required: ["title", "startTime", "endTime"],
    },
    isMutating: true,
  },
  {
    name: "create_drive_file",
    description: "Creates a document in student Google Drive folder. Requires confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        fileName: { type: "string" },
        content: { type: "string" },
      },
      required: ["fileName", "content"],
    },
    isMutating: true,
  },
  {
    name: "send_event_confirmation",
    description: "Dispatches ticket confirmation via Gmail. Requires confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        recipientEmail: { type: "string" },
        eventId: { type: "string" },
      },
      required: ["recipientEmail", "eventId"],
    },
    isMutating: true,
  },
  {
    name: "search_campus_events",
    description: "Search events by keywords.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
    isMutating: false,
  },
  {
    name: "get_payment_status",
    description: "Retrieve registration payment status.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: { type: "string" },
      },
      required: ["orderId"],
    },
    isMutating: false,
  },
  {
    name: "get_user_tasks",
    description: "Retrieve user tasks and deadlines.",
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
      },
      required: ["userId"],
    },
    isMutating: false,
  },
];
