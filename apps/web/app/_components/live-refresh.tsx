"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Re-renders the server component tree every few seconds while the tab is visible. */
export function LiveRefresh({
  children,
  intervalMs = 4000,
}: {
  readonly children: ReactNode;
  readonly intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return <>{children}</>;
}

export function LiveBadge() {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-ink/[0.05] px-2 font-semibold text-ink-2 text-xs">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ink opacity-40 motion-reduce:hidden" />
        <span className="relative inline-flex size-1.5 rounded-full bg-ink" />
      </span>
      En vivo
    </span>
  );
}
