import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { SimTag } from "@/components/brand";
import type { Agent } from "@/lib/db/store";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { PermissionChips } from "./permission-chips";

export function AgentCard({
  agent,
  showCreator = true,
  animate = false,
  className,
}: {
  readonly agent: Agent;
  readonly showCreator?: boolean;
  readonly animate?: boolean;
  readonly className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl bg-sheet p-4 ring-1 ring-line transition-[box-shadow] duration-200 ease-settle hover:ring-ink/20",
        animate && "rise",
        className,
      )}
    >
      {showCreator ? (
        <header className="flex items-center gap-2 text-ink-3 text-xs">
          <Link className="flex items-center gap-2 hover:text-ink" href={`/u/${encodeURIComponent(agent.ownerId)}`}>
            <Avatar image={agent.ownerImage} name={agent.ownerName} className="size-6" />
            <span>
              <strong className="font-semibold text-ink-2">{agent.ownerName}</strong> creó
            </span>
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={new Date(agent.createdAt).toISOString()}>{timeAgo(agent.createdAt)}</time>
        </header>
      ) : null}

      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-xl">
          {agent.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-base leading-6">
            <Link className="after:absolute after:inset-0 after:rounded-2xl" href={`/agents/${encodeURIComponent(agent.id)}`}>
              {agent.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-ink-2 text-sm leading-5">{agent.description}</p>
        </div>
        <ChevronRightIcon
          aria-hidden="true"
          className="mt-2.5 size-4 shrink-0 text-ink-3 transition-transform duration-200 ease-settle group-hover:translate-x-0.5"
          strokeWidth={2.2}
        />
      </div>

      <PermissionChips compact permissions={agent.permissions} />

      <footer className="flex items-center justify-between gap-3 text-ink-3 text-xs">
        <span className="tnum">
          <span className="font-semibold text-ink-2">{agent.runsCount}</span>{" "}
          {agent.runsCount === 1 ? "ejecución" : "ejecuciones"}
        </span>
        <span className="flex items-center gap-1.5 tnum">
          Límite US$ <span className="font-semibold text-ink-2">{agent.cardLimitUsd}</span>
          <SimTag />
        </span>
      </footer>
    </article>
  );
}
