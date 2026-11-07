import type { Metadata } from "next";
import { getStore } from "@/lib/db/store";
import { AgentChatPage } from "./_components/agent-chat-page";

export const dynamic = "force-dynamic";

type Params = Promise<{ readonly id: string }>;

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const { id } = await params;
  const agent = await getStore().getAgent(id);
  return { title: agent ? `${agent.emoji} ${agent.name}` : "Agente" };
}

export default async function AgentPage({ params }: { readonly params: Params }) {
  const { id } = await params;
  return <AgentChatPage agentId={id} />;
}
