import Link from "next/link";
import { MangoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getStore } from "@/lib/db/store";
import { AgentCard } from "./_components/agent-card";
import { LiveBadge, LiveRefresh } from "./_components/live-refresh";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = getStore();
  const [stats, agents] = await Promise.all([store.stats(), store.listAgents({ limit: 30 })]);

  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-4 pt-8 pb-12">
      <section className="flex flex-col gap-4">
        <p className="font-semibold text-ink-3 text-sm">Tu plata, tus reglas.</p>
        <h1 className="font-bold text-[28px] leading-[1.15] tracking-[-0.02em]">
          Tu agente opera.
          <br />
          <span className="text-ink-3">Vos decidís.</span>
        </h1>
        <p className="text-ink-2">
          Cada persona crea su propio agente con permisos sobre una cuenta belo de prueba. El agente
          propone pagos, cambios y movimientos; nada se ejecuta sin tu OK.
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <Button asChild>
            <Link href="/agents/new">Crear mi agente</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/agents">Ver todos los agentes</Link>
          </Button>
        </div>
      </section>

      <StatsRow stats={stats} />

      <LiveRefresh>
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl tracking-[-0.01em]">Recién creados</h2>
            <LiveBadge />
          </div>
          {agents.length === 0 ? (
            <EmptyFeed />
          ) : (
            <ol className="flex flex-col gap-3">
              {agents.map((agent, index) => (
                <li key={agent.id}>
                  <AgentCard agent={agent} animate={index === 0} />
                </li>
              ))}
            </ol>
          )}
        </section>
      </LiveRefresh>
    </main>
  );
}

function StatsRow({ stats }: { readonly stats: { agents: number; creators: number; runs: number } }) {
  const items = [
    { label: "agentes", value: stats.agents },
    { label: "creadores", value: stats.creators },
    { label: "ejecuciones", value: stats.runs },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-sheet ring-1 ring-line">
      {items.map((item) => (
        <div className="flex flex-col gap-0.5 px-4 py-3" key={item.label}>
          <dd className="font-bold text-[28px] text-ink leading-none tnum">{item.value}</dd>
          <dt className="text-ink-3 text-xs">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-sheet px-6 py-8 text-center ring-1 ring-line">
      <MangoMark size={56} />
      <p className="text-ink-2">Todavía nadie creó un agente.</p>
      <Button asChild size="sm" variant="secondary">
        <Link href="/agents/new">Sé el primero</Link>
      </Button>
    </div>
  );
}
