/**
 * Who can talk to the agent, and as which user-created agent.
 *
 * The web app sends `x-agent-id` with every request to `/eve/v1/*`. Each
 * authenticator verifies the caller, then `withAgent` checks that the agent
 * exists and records it in the caller's attributes, where dynamic
 * instructions, tools and hooks read it.
 */
import { eveChannel } from "eve/channels/eve";
import { ForbiddenError, localDev, type AuthFn, vercelOidc } from "eve/channels/auth";
import type { SessionAuthContext } from "eve/context";
import { auth } from "../../apps/web/lib/auth.js";
import { getStore } from "../../apps/web/lib/db/store.js";

export const AGENT_ID_HEADER = "x-agent-id";

async function withAgent(request: Request, context: SessionAuthContext): Promise<SessionAuthContext> {
  const agentId = request.headers.get(AGENT_ID_HEADER);
  // The terminal UI and server callers send no agent: they get the demo profile.
  if (!agentId) return context;

  const agent = await getStore().getAgent(agentId);
  if (!agent) {
    throw new ForbiddenError({ message: `El agente ${agentId} no existe.` });
  }
  return {
    ...context,
    attributes: { ...context.attributes, agentId: agent.id, agentName: agent.name },
  };
}

/** Sign in with Vercel (Better Auth cookie) for browser users in production. */
const betterAuthSession: AuthFn<Request> = async (request) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  const attributes: Record<string, string> = {
    email: session.user.email,
    name: session.user.name,
  };
  if (session.user.image) {
    attributes.picture = session.user.image;
  }

  return withAgent(request, {
    attributes,
    authenticator: "better-auth:vercel",
    principalId: session.user.id,
    principalType: "user",
  });
};

/** Local development: no sign-in, but still run as the requested agent. */
const localDevWithAgent: AuthFn<Request> = async (request) => {
  const context = await localDev()(request);
  return context ? withAgent(request, context) : null;
};

export default eveChannel({
  auth: [betterAuthSession, vercelOidc(), localDevWithAgent],
});
