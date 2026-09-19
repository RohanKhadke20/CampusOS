import { CAMPUSOS_MCP_TOOLS } from "./tools.js";

export function initMCPServer() {
  return {
    name: "campusos-mcp-server",
    version: "1.0.0",
    tools: CAMPUSOS_MCP_TOOLS,
  };
}

export * from "./tools.js";
