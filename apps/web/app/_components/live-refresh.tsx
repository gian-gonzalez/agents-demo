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
    <span className="inline-flex items-center gap-2 font-mono text-[0.65rem] text-primary uppercase tracking-widest">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      En vivo
    </span>
  );
}
