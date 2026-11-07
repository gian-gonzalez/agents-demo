import { AgentChatPage } from "../_components/agent-chat-page";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({ params }: { readonly params: Promise<{ readonly id: string }> }) {
  const { id } = await params;
  return <AgentChatPage agentId={id} sessionless />;
}
