import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
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
        "group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40",
        animate && "animate-in fade-in slide-in-from-top-2 duration-500",
        className,
      )}
    >
      {showCreator ? (
        <header className="flex items-center gap-2 text-muted-foreground text-xs">
          <Link className="flex items-center gap-2 hover:text-foreground" href={`/u/${encodeURIComponent(agent.ownerId)}`}>
            <Avatar image={agent.ownerImage} name={agent.ownerName} className="size-6" />
            <span>
              <strong className="font-medium text-foreground">{agent.ownerName}</strong> creó
            </span>
          </Link>
          <span aria-hidden="true">·</span>
          <time className="font-mono" dateTime={new Date(agent.createdAt).toISOString()}>
            {timeAgo(agent.createdAt)}
          </time>
        </header>
      ) : null}

      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40 text-xl">
          {agent.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium leading-6">
            <Link className="after:absolute after:inset-0" href={`/agents/${encodeURIComponent(agent.id)}`}>
              {agent.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-muted-foreground text-sm leading-5">{agent.description}</p>
        </div>
      </div>

      <PermissionChips compact permissions={agent.permissions} />

      <footer className="flex items-center justify-between font-mono text-xs">
        <span className="text-muted-foreground">
          runs: <span className="text-foreground">{agent.runsCount}</span>
          <span aria-hidden="true"> · </span>
          límite US${agent.cardLimitUsd}
        </span>
        <span className="inline-flex items-center gap-1 text-primary group-hover:underline">
          Probar agente <ArrowRightIcon className="size-3" />
        </span>
      </footer>
    </article>
  );
}
