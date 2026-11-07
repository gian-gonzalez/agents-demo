import { notFound } from "next/navigation";
import { getStore } from "@/lib/db/store";
import { AuthenticatedAgentChat } from "../../../_components/authenticated-agent-chat";
import { AgentHeader } from "./agent-header";

/** The agent page: header on top (mobile) or as a left panel (desktop), chat filling the rest. */
export async function AgentChatPage({
  agentId,
  sessionId,
  sessionless,
}: {
  readonly agentId: string;
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  const agent = await getStore().getAgent(agentId);
  if (!agent) notFound();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] min-h-0 w-full max-w-6xl flex-col overflow-hidden bg-paper lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8">
      <AgentHeader agent={agent} />
      <AuthenticatedAgentChat
        agentEmoji={agent.emoji}
        agentId={agent.id}
        agentName={agent.name}
        sessionId={sessionId}
        sessionless={sessionless}
      />
    </div>
  );
}
