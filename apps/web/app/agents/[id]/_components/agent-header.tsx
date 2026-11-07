import Link from "next/link";
import { Chip, ProgressBar, SimTag } from "@/components/brand";
import type { Agent } from "@/lib/db/store";
import { BELO_PERMISSION_LABELS, isBeloPermission } from "@/lib/belo";
import { timeAgo } from "@/lib/time";
import { Avatar } from "../../../_components/avatar";

/**
 * Cabecera del agente: ícono en círculo blanco, nombre 20/700, creador, permisos como Chips y
 * el límite de tarjeta con SimTag. Sin acción mango: la acción primaria de esta pantalla es
 * el botón enviar del chat.
 */
const usd = (value: number) =>
  `US$${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)}`;

export function AgentHeader({ agent, spentUsd }: { readonly agent: Agent; readonly spentUsd: number }) {
  return (
    <section className="shrink-0 border-line border-b bg-paper lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex w-full flex-col gap-3 px-4 pt-3 pb-4 sm:px-6 lg:gap-4 lg:px-0 lg:pt-8 lg:pr-8">
        <div className="flex items-start gap-3 lg:flex-col lg:gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sheet text-2xl ring-1 ring-line lg:size-20 lg:text-4xl"
          >
            {agent.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold text-[20px] leading-6 tracking-[-0.01em] lg:whitespace-normal lg:text-[28px] lg:leading-[1.15] lg:tracking-[-0.02em]">{agent.name}</h1>
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-ink-3 text-xs leading-5">
              <Link
                className="inline-flex min-w-0 items-center gap-1.5 hover:text-ink"
                href={`/u/${encodeURIComponent(agent.ownerId)}`}
              >
                <Avatar className="size-5 text-[0.55rem]" image={agent.ownerImage} name={agent.ownerName} />
                <span className="truncate font-semibold text-ink-2">{agent.ownerName}</span>
              </Link>
              <span aria-hidden="true">·</span>
              <time className="tnum" dateTime={new Date(agent.createdAt).toISOString()}>
                {timeAgo(agent.createdAt)}
              </time>
              <span aria-hidden="true">·</span>
              <span className="tnum">
                {agent.runsCount} {agent.runsCount === 1 ? "ejecución" : "ejecuciones"}
              </span>
            </p>
          </div>
        </div>

        <p className="text-ink-2 text-sm leading-5">{agent.description}</p>

        <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
          {agent.permissions.length === 0 ? (
            <Chip>sin permisos</Chip>
          ) : (
            agent.permissions.map((permission) => (
              <Chip key={permission} title={isBeloPermission(permission) ? BELO_PERMISSION_LABELS[permission] : permission}>
                {isBeloPermission(permission) ? BELO_PERMISSION_LABELS[permission] : permission}
              </Chip>
            ))
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-ink-3 text-xs lg:ml-0 lg:w-full lg:pt-2">
            <span className="tnum">límite US${agent.cardLimitUsd} por operación</span>
            <SimTag />
          </span>
        </div>

        {/* Presupuesto mensual real: gasto acumulado entre todas las conversaciones del agente. */}
        <div className="flex flex-col gap-2 rounded-2xl bg-sheet px-4 py-3 ring-1 ring-line">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-ink-3 text-xs">Usado este mes</span>
            <span className="text-ink-3 text-xs tnum">
              {agent.monthlyBudgetUsd == null ? "sin tope mensual" : `de ${usd(agent.monthlyBudgetUsd)}`}
            </span>
          </div>
          <span className="font-bold text-[28px] leading-none tracking-[-0.02em] tnum">{usd(spentUsd)}</span>
          {agent.monthlyBudgetUsd == null ? null : <ProgressBar max={agent.monthlyBudgetUsd} value={spentUsd} />}
        </div>
      </div>
    </section>
  );
}
