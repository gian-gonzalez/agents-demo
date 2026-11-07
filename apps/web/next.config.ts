import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo already has AGENTS.md/CLAUDE.md at the root; don't generate more in apps/web.
  agentRules: false,
};

export default nextConfig;
