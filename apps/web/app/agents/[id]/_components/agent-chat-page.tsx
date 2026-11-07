import { notFound } from "next/navigation";
import { getStore } from "@/lib/db/store";
import { AuthenticatedAgentChat } from "../../../_components/authenticated-agent-chat";
import { AgentHeader } from "./agent-header";

/** The agent page: header on top, chat filling the rest of the viewport under the nav. */
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
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
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
