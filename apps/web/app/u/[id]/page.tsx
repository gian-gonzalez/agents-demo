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
    <main className="flex w-full flex-1 flex-col gap-6 px-4 pt-8 pb-12">
      <header className="flex items-center gap-4">
        <Avatar className="size-14 text-base" image={first.ownerImage} name={first.ownerName} />
        <div className="min-w-0">
          <p className="font-semibold text-ink-3 text-sm">Creador</p>
          <h1 className="truncate font-bold text-[28px] leading-[1.15] tracking-[-0.02em]">{first.ownerName}</h1>
          <p className="text-ink-3 text-xs tnum">
            {publicAgents.length} {publicAgents.length === 1 ? "agente" : "agentes"} · {runs}{" "}
            {runs === 1 ? "ejecución" : "ejecuciones"}
          </p>
        </div>
      </header>

      {publicAgents.length === 0 ? (
        <p className="rounded-2xl bg-sheet px-6 py-8 text-center text-ink-2 ring-1 ring-line">Sus agentes son privados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
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
