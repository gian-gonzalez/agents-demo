import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db/store";
import { AgentCard } from "../../_components/agent-card";
import { Avatar } from "../../_components/avatar";

export const dynamic = "force-dynamic";

type Params = Promise<{ readonly id: string }>;

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const { id } = await params;
  const [agent] = await getStore().listAgents({ ownerId: id, limit: 1 });
  return { title: agent ? agent.ownerName : "Creador" };
}

export default async function CreatorPage({ params }: { readonly params: Params }) {
  const { id } = await params;
  const agents = await getStore().listAgents({ ownerId: id, limit: 100 });
  const publicAgents = agents.filter((agent) => agent.visibility === "public");
  const first = agents[0];
  if (!first) notFound();

  const runs = publicAgents.reduce((sum, agent) => sum + agent.runsCount, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex items-center gap-4">
        <Avatar className="size-14 text-base" image={first.ownerImage} name={first.ownerName} />
        <div className="min-w-0">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">Creador</p>
          <h1 className="truncate font-medium text-2xl tracking-tight">{first.ownerName}</h1>
          <p className="font-mono text-muted-foreground text-xs">
            {publicAgents.length} {publicAgents.length === 1 ? "agente" : "agentes"} · {runs} runs
          </p>
        </div>
      </header>

      {publicAgents.length === 0 ? (
        <p className="rounded-lg border border-border border-dashed p-6 font-mono text-muted-foreground text-sm">
          [EMPTY] Sus agentes son privados.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicAgents.map((agent) => (
            <li key={agent.id}>
              <AgentCard agent={agent} showCreator={false} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
