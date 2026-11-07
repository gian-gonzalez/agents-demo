/**
 * Resolves which user-created agent a session is running as.
 *
 * The web app sends `x-agent-id` with every request; the eve channel's auth
 * function verifies it and stores it in the caller's `attributes`. Dynamic
 * instructions and tools then call `resolveProfile(ctx)` to load that agent
 * from the store (Neon Postgres on Vercel, in-memory in local development).
 *
 * Sessions without an agent (the terminal UI, server callers) run the demo
 * profile, which has every belo permission.
 */
import type { DynamicContext } from "eve/tools";
import { getStore } from "../../apps/web/lib/db/store.js";
import { BELO_PERMISSIONS, isBeloPermission, type AgentProfile } from "./profile";

export const DEMO_PROFILE: AgentProfile = {
  id: "demo",
  name: "Agente demo",
  emoji: "🤖",
  description: "Agente de prueba con todos los permisos de belo habilitados.",
  instructions:
    "Ayudás a la persona a operar su cuenta belo: consultás saldos y rendimientos, proponés cambios de moneda y pagos con tarjeta cuando te lo piden.",
  permissions: [...BELO_PERMISSIONS],
  cardLimitUsd: 2000,
  monthlyBudgetUsd: null,
  ownerId: "local-dev",
  ownerName: "Desarrollador local",
};

export function agentIdFromSession(ctx: Pick<DynamicContext, "session">): string | null {
  const agentId = ctx.session.auth.initiator?.attributes.agentId;
  return typeof agentId === "string" && agentId.length > 0 ? agentId : null;
}

async function loadProfile(agentId: string): Promise<AgentProfile | null> {
  const agent = await getStore().getAgent(agentId);
  if (!agent) return null;
  return {
    id: agent.id,
    name: agent.name,
    emoji: agent.emoji,
    description: agent.description,
    instructions: agent.instructions,
    permissions: agent.permissions.filter(isBeloPermission),
    cardLimitUsd: agent.cardLimitUsd,
    monthlyBudgetUsd: agent.monthlyBudgetUsd ?? null,
    ownerId: agent.ownerId,
    ownerName: agent.ownerName,
  };
}

/**
 * Loads the session's agent profile once per session (memoized) so every
 * model call sees the same persona and tool set, even after a cold start.
 */
export async function resolveProfile(ctx: DynamicContext): Promise<AgentProfile> {
  const agentId = agentIdFromSession(ctx);
  if (!agentId) return DEMO_PROFILE;
  const profile = await ctx.memo(["profile", agentId], () => loadProfile(agentId));
  return (profile as AgentProfile | null) ?? DEMO_PROFILE;
}
