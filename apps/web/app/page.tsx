import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Chip, MangoMark } from "@/components/brand";
import { SHOWCASE_CASES } from "@/lib/showcase";
import { Button } from "@/components/ui/button";
import { getStore } from "@/lib/db/store";
import { AgentCard } from "./_components/agent-card";
import { LiveBadge, LiveRefresh } from "./_components/live-refresh";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = getStore();
  const [stats, agents] = await Promise.all([store.stats(), store.listAgents({ limit: 30 })]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-8 pb-12 sm:px-6 md:gap-10 md:pt-12 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-end lg:gap-12">
      <section className="flex flex-col gap-4">
        <p className="font-semibold text-ink-3 text-sm">Tu plata, tus reglas.</p>
        <h1 className="font-bold text-[28px] leading-[1.1] tracking-[-0.02em] md:text-[40px] lg:text-[52px] lg:tracking-[-0.03em]">
          Tu agente opera.
          <br />
          <span className="text-ink-3">En automático.</span>
        </h1>
        <p className="max-w-xl text-ink-2 md:text-lg">
          Cada persona crea su propio agente con permisos sobre una cuenta belo de prueba. El agente
          ejecuta pagos, cambios y movimientos por sí solo, dentro del límite por operación y el
          presupuesto mensual que le fijás.
        </p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3">
          <Button asChild>
            <Link href="/agents/new">Crear mi agente</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/agents">Ver todos los agentes</Link>
          </Button>
        </div>
      </section>

      <StatsRow stats={stats} />
      </div>

      <ShowcaseSection />

      <LiveRefresh>
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl tracking-[-0.01em]">Recién creados</h2>
            <LiveBadge />
          </div>
          {agents.length === 0 ? (
            <EmptyFeed />
          ) : (
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
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
    <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-sheet ring-1 ring-line md:grid-cols-1 md:divide-x-0 md:divide-y">
      {items.map((item) => (
        <div className="flex flex-col gap-0.5 px-4 py-3 md:flex-row md:items-baseline md:justify-between md:px-6 md:py-5" key={item.label}>
          <dd className="font-bold text-[28px] text-ink leading-none tnum md:order-2 md:text-[40px] md:tracking-[-0.03em]">{item.value}</dd>
          <dt className="text-ink-3 text-xs md:order-1 md:text-sm">{item.label}</dt>
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

/** Dos agentes reales con una conversación guardada: para mostrar la demo aunque nadie haya creado nada todavía. */
function ShowcaseSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-xl tracking-[-0.01em]">Casos de ejemplo</h2>
        <p className="text-ink-3 text-sm">Dos agentes ya creados, con una conversación real guardada. Probalos en vivo o leé cómo respondieron.</p>
      </div>
      <ol className="grid gap-3 md:grid-cols-2 lg:gap-4">
        {SHOWCASE_CASES.map((c) => (
          <li className="flex flex-col gap-4 rounded-2xl bg-sheet p-5 ring-1 ring-line" key={c.slug}>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-2xl">
                {c.emoji}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-ink-3 text-xs font-semibold uppercase tracking-[0.06em]">Caso {c.number}</span>
                <h3 className="font-bold text-lg leading-6 tracking-[-0.01em]">{c.title}</h3>
              </div>
            </div>
            <p className="text-ink-2 text-sm leading-5">{c.blurb}</p>
            <div className="flex flex-wrap gap-1.5">
              {c.highlights.map((h) => (
                <Chip key={h}>{h}</Chip>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
              <Button asChild className="sm:flex-1" variant="secondary">
                <Link href={`/casos/${c.slug}`}>Ver la conversación</Link>
              </Button>
              <Button asChild className="sm:flex-1" variant="secondary">
                <Link href={`/agents/${encodeURIComponent(c.agentId)}`}>
                  Probar en vivo
                  <ArrowRightIcon className="size-4" strokeWidth={2.2} />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
