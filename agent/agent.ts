import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-opus-5.5",
  // The agent only operates the mock belo account through authored tools:
  // no bash, file or web tools, so no sandbox is ever started.
  defaultTools: false,
  limits: {
    // A demo conversation should never cost more than this before asking.
    sessionUsage: ({ window }) => (window.costUsd ?? 0) >= 1,
  },
});
