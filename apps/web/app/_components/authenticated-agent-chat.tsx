import { getCurrentUser, isDevelopment } from "@/lib/current-user";
import { AgentChat } from "./agent-chat";
import { SignIn } from "./web-chat-auth";

/** The chat for one user-created agent; requires Sign in with Vercel outside development. */
export async function AuthenticatedAgentChat({
  agentId,
  agentName,
  agentEmoji,
  sessionId,
  sessionless,
}: {
  readonly agentId: string;
  readonly agentName: string;
  readonly agentEmoji: string;
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  const chat = (
    <AgentChat
      agentEmoji={agentEmoji}
      agentId={agentId}
      agentName={agentName}
      sessionId={sessionId}
      sessionless={sessionless}
    />
  );

  if (isDevelopment) return chat;

  const user = await getCurrentUser();
  if (!user) {
    return (
      <SignIn
        callbackURL={`/agents/${encodeURIComponent(agentId)}`}
        message={`Entrá con Vercel para hablar con ${agentName}`}
        embedded
      />
    );
  }

  return chat;
}
