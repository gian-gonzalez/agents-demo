import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStore } from "@/lib/db/store";
import { AgentCard } from "./_components/agent-card";
import { LiveBadge, LiveRefresh } from "./_components/live-refresh";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = getStore();
  const [stats, agents] = await Promise.all([store.stats(), store.listAgents({ limit: 30 })]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-6">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
          La capa bancaria para agentes (&amp; humanos)
        </p>
        <h1 className="max-w-3xl font-medium text-3xl tracking-tight sm:text-5xl">
          Tu agente opera.
          <br />
          <span className="text-muted-foreground">Vos decidís.</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Cada persona crea su propio agente con permisos sobre una cuenta belo de prueba. El agente
          propone pagos, cambios y movimientos; nada se ejecuta sin aprobación humana.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/agents/new">Crear mi agente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/agents">Ver todos los agentes</Link>
          </Button>
        </div>
      </section>

      <StatsRow stats={stats} />

      <LiveRefresh>
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Agentes recién creados
            </h2>
            <LiveBadge />
          </div>
          {agents.length === 0 ? (
            <EmptyFeed />
          ) : (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <dl className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card font-mono">
      {items.map((item) => (
        <div className="flex flex-col gap-1 px-4 py-3 sm:px-6" key={item.label}>
          <dt className="text-[0.65rem] text-muted-foreground uppercase tracking-widest">{item.label}</dt>
          <dd className="text-2xl tabular-nums sm:text-3xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border border-dashed p-6 font-mono text-sm">
      <span className="text-muted-foreground">$ belo agents list</span>
      <span className="text-muted-foreground">[EMPTY] Todavía nadie creó un agente.</span>
      <Button asChild size="sm" variant="outline">
        <Link href="/agents/new">Sé el primero →</Link>
      </Button>
    </div>
  );
}
