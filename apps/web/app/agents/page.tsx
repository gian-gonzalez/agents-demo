import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStore } from "@/lib/db/store";
import { AgentCard } from "../_components/agent-card";
import { Avatar } from "../_components/avatar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agentes" };

export default async function AgentsPage() {
  const store = getStore();
  const [agents, creators] = await Promise.all([store.listAgents({ limit: 100 }), store.listCreators()]);

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_16rem]">
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">Agentes</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {agents.length} {agents.length === 1 ? "agente público" : "agentes públicos"}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/agents/new">Crear agente</Link>
          </Button>
        </div>
        {agents.length === 0 ? (
          <p className="rounded-lg border border-border border-dashed p-6 font-mono text-muted-foreground text-sm">
            [EMPTY] Todavía no hay agentes públicos.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {agents.map((agent) => (
              <li key={agent.id}>
                <AgentCard agent={agent} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="flex flex-col gap-3">
        <h2 className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">Creadores</h2>
        {creators.length === 0 ? (
          <p className="font-mono text-muted-foreground text-xs">[EMPTY]</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            {creators.map((creator) => (
              <li key={creator.id}>
                <Link
                  className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent/50"
                  href={`/u/${encodeURIComponent(creator.id)}`}
                >
                  <Avatar image={creator.image} name={creator.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{creator.name}</span>
                    <span className="block font-mono text-[0.65rem] text-muted-foreground">
                      {creator.agentsCount} {creator.agentsCount === 1 ? "agente" : "agentes"} · {creator.runsCount} runs
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}
