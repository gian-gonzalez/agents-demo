import Link from "next/link";
import type { Agent } from "@/lib/db/store";
import { timeAgo } from "@/lib/time";
import { Avatar } from "../../../_components/avatar";
import { PermissionChips } from "../../../_components/permission-chips";

export function AgentHeader({ agent }: { readonly agent: Agent }) {
  return (
    <section className="border-border border-b bg-card/40">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/40 text-2xl">
            {agent.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate font-medium text-lg leading-6">{agent.name}</h1>
              <span className="font-mono text-[0.65rem] text-primary uppercase tracking-widest">[Ready]</span>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
              <span>creado por</span>
              <Link className="inline-flex items-center gap-1.5 hover:text-foreground" href={`/u/${encodeURIComponent(agent.ownerId)}`}>
                <Avatar image={agent.ownerImage} name={agent.ownerName} className="size-5 text-[0.55rem]" />
                <span className="font-medium text-foreground">{agent.ownerName}</span>
              </Link>
              <span aria-hidden="true">·</span>
              <time className="font-mono" dateTime={new Date(agent.createdAt).toISOString()}>
                {timeAgo(agent.createdAt)}
              </time>
            </p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">{agent.description}</p>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <PermissionChips className="hidden sm:flex" compact permissions={agent.permissions} />
          <span className="font-mono text-muted-foreground text-xs">
            límite US${agent.cardLimitUsd}
            <span aria-hidden="true"> · </span>
            runs: <span className="text-foreground">{agent.runsCount}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
