import Link from "next/link";
import { Chip, SimTag } from "@/components/brand";
import type { Agent } from "@/lib/db/store";
import { BELO_PERMISSION_LABELS, isBeloPermission } from "@/lib/belo";
import { timeAgo } from "@/lib/time";
import { Avatar } from "../../../_components/avatar";

/**
 * Cabecera del agente: ícono en círculo blanco, nombre 20/700, creador, permisos como Chips y
 * el límite de tarjeta con SimTag. Sin acción mango: la acción primaria de esta pantalla es
 * el botón enviar del chat.
 */
export function AgentHeader({ agent }: { readonly agent: Agent }) {
  return (
    <section className="shrink-0 border-line border-b bg-paper">
      <div className="flex w-full flex-col gap-3 px-4 pt-3 pb-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sheet text-2xl ring-1 ring-line"
          >
            {agent.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold text-[20px] leading-6 tracking-[-0.01em]">{agent.name}</h1>
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

        <div className="flex flex-wrap items-center gap-1.5">
          {agent.permissions.length === 0 ? (
            <Chip>sin permisos</Chip>
          ) : (
            agent.permissions.map((permission) => (
              <Chip key={permission} title={isBeloPermission(permission) ? BELO_PERMISSION_LABELS[permission] : permission}>
                {isBeloPermission(permission) ? BELO_PERMISSION_LABELS[permission] : permission}
              </Chip>
            ))
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 text-ink-3 text-xs">
            <span className="tnum">límite US${agent.cardLimitUsd}</span>
            <SimTag />
          </span>
        </div>
      </div>
    </section>
  );
}
