/**
 * Records every finished turn as a "run" of the user-created agent, so the
 * web app can show how many times each agent was used and what it cost.
 */
import { runs as runsOf } from "eve/events";
import { defineHook } from "eve/hooks";
import { getStore } from "../../apps/web/lib/db/store.js";

export default defineHook({
  events: {
    async "turn.settled"(event, ctx) {
      const attributes = ctx.session.auth.initiator?.attributes;
      const agentId = attributes?.agentId;
      if (typeof agentId !== "string" || agentId.length === 0) return; // terminal UI / demo profile

      const turnId = event.data.turnId;
      let inputTokens = 0;
      let outputTokens = 0;
      let costUsd = 0;
      let hasCost = false;
      for (const run of runsOf(ctx.view, { turnId })) {
        inputTokens += run.usage?.inputTokens ?? 0;
        outputTokens += run.usage?.outputTokens ?? 0;
        if (typeof run.usage?.costUsd === "number") {
          costUsd += run.usage.costUsd;
          hasCost = true;
        }
      }

      const caller = ctx.session.auth.current ?? ctx.session.auth.initiator;
      const callerName = caller?.attributes.name;
      try {
        await getStore().recordRun({
          agentId,
          sessionId: ctx.session.id,
          turnId,
          userId: caller?.principalId ?? null,
          userName: typeof callerName === "string" ? callerName : null,
          outcome: event.data.outcome,
          costUsd: hasCost ? costUsd : null,
          inputTokens,
          outputTokens,
        });
      } catch (error) {
        // Bookkeeping must never fail the conversation.
        console.warn("No se pudo registrar la ejecución", { agentId, turnId, error });
      }
    },
  },
});
