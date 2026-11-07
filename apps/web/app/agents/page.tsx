import type { Metadata } from "next";
import Link from "next/link";
import { MangoMark } from "@/components/brand";
import { getStore } from "@/lib/db/store";
import { AgentCard } from "../_components/agent-card";
import { Avatar } from "../_components/avatar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agentes" };

export default async function AgentsPage() {
  const store = getStore();
  const [agents, creators] = await Promise.all([store.listAgents({ limit: 100 }), store.listCreators()]);

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 pt-8 pb-12 sm:px-6 md:pt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10 lg:px-8">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="font-bold text-[28px] leading-[1.15] tracking-[-0.02em]">Agentes</h1>
          <p className="mt-1 text-ink-3 text-sm tnum">
            {agents.length} {agents.length === 1 ? "agente público" : "agentes públicos"}
          </p>
        </div>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-sheet px-6 py-8 text-center ring-1 ring-line">
            <MangoMark size={56} />
            <p className="text-ink-2">Todavía no hay agentes públicos.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4 2xl:grid-cols-3">
            {agents.map((agent) => (
              <li key={agent.id}>
                <AgentCard agent={agent} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 lg:sticky lg:top-20">
        <h2 className="font-bold text-xl tracking-[-0.01em]">Creadores</h2>
        {creators.length === 0 ? (
          <p className="text-ink-3 text-sm">Todavía no hay creadores.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-2xl bg-sheet ring-1 ring-line">
            {creators.map((creator) => (
              <li key={creator.id}>
                <Link
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 ease-settle first:rounded-t-2xl last:rounded-b-2xl hover:bg-ink/[0.03]"
                  href={`/u/${encodeURIComponent(creator.id)}`}
                >
                  <Avatar className="size-9" image={creator.image} name={creator.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{creator.name}</span>
                    <span className="block text-ink-3 text-xs tnum">
                      {creator.agentsCount} {creator.agentsCount === 1 ? "agente" : "agentes"} · {creator.runsCount}{" "}
                      {creator.runsCount === 1 ? "ejecución" : "ejecuciones"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
