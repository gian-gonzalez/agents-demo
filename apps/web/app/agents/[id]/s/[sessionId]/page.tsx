import { AgentChatPage } from "../../_components/agent-chat-page";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  return <AgentChatPage agentId={id} sessionId={sessionId} />;
}
