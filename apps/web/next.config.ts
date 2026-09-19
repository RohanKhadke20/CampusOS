import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@campusos/core",
    "@campusos/db",
    "@campusos/integrations",
    "@campusos/ai",
    "@campusos/ui",
    "@campusos/mcp-server",
  ],
};

export default nextConfig;
