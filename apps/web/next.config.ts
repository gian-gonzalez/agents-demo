import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo already has AGENTS.md/CLAUDE.md at the root; don't generate more in apps/web.
  agentRules: false,
  // Local `next dev` alone: forward the eve channel to `eve dev` on :2000. On Vercel, vercel.ts
  // routes `/eve/*` to the eve service, so no rewrite is needed there.
  async rewrites() {
    if (process.env.VERCEL === "1") return [];
    const eveOrigin = process.env.EVE_DEV_ORIGIN ?? "http://127.0.0.1:2000";
    return [{ source: "/eve/:path*", destination: `${eveOrigin}/eve/:path*` }];
  },
};

export default nextConfig;
