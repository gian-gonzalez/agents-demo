import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  // Direct Anthropic call (reads ANTHROPIC_API_KEY). Switch back to the gateway
  // string "anthropic/claude-opus-5.5" once AI Gateway is enabled on the account.
  model: anthropic("claude-opus-5-5"),
  // The agent only operates the mock belo account through authored tools:
  // no bash, file or web tools, so no sandbox is ever started.
  defaultTools: false,
  limits: {
    // A demo conversation should never cost more than this before asking.
    sessionUsage: ({ window }) => (window.costUsd ?? 0) >= 1,
  },
});
