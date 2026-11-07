/**
 * Primitivas de marca Mango. Fuente de verdad junto con los tokens de app/globals.css.
 *
 * - MangoMark: el logo (mango inclinado + óvalo con check: "la regla se cumple").
 * - Wordmark: "mango" en minúscula, Archivo 700, tracking −0.02em. Solo en la tarjeta.
 * - CardArt: la tarjeta mango (ratio 1.586) y su versión mini para listas.
 * - StatusPill: veredictos del motor (Aprobado / Rechazado / Espera tu OK).
 * - SimTag: "SIMULADO", obligatorio en todo pago, carga o saldo simulado.
 */
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------- */
/* Logo                                                                                           */
/* ---------------------------------------------------------------------------------------------- */

export function MangoMark({ size = 26, className, ...props }: { readonly size?: number } & ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="none"
      height={size}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Mango inclinado: cuerpo, sombra lateral, hoja */}
      <g transform="rotate(-18 32 34)">
        <ellipse cx="32" cy="36" fill="#FFB21A" rx="21" ry="25" />
        <path d="M44 14c8 6 11 18 7 30-3 9-9 15-17 17 10-6 15-16 15-27 0-8-2-14-5-20Z" fill="#FF6B1A" />
        <path d="M31 11c-1-5 2-9 7-10-1 4 0 7 3 9-4 1-7 1-10 1Z" fill="#1F7A45" />
      </g>
      {/* Óvalo blanco rotado −14° con check verde: "la regla se cumple" */}
      <g transform="rotate(-14 34 40)">
        <ellipse cx="34" cy="40" fill="#FFFFFF" rx="14" ry="10" />
        <path
          d="M27.5 40.5l4.5 4.5 8.5-9"
          stroke="#1F7A45"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.2"
        />
      </g>
    </svg>
  );
}

export function Wordmark({ className, ...props }: ComponentProps<"span">) {
  return (
    <span className={cn("font-bold lowercase leading-none tracking-[-0.02em]", className)} {...props}>
      mango
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* Tarjeta                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

/**
 * Tarjeta mango. Nunca datos completos: solo nombre, titular y •••• últimos 4.
 * `mini` es la versión 54×34 para listas.
 */
export function CardArt({
  name,
  holder,
  last4 = "1234",
  mini = false,
  className,
}: {
  readonly name: string;
  readonly holder?: string;
  readonly last4?: string;
  readonly mini?: boolean;
  readonly className?: string;
}) {
  if (mini) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "relative flex h-[34px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-mango",
          className,
        )}
      >
        <span className="flex size-[16px] items-center justify-center rounded-full bg-sheet">
          <MangoMark size={10} />
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-[20px] bg-mango p-5 text-ink shadow-float",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-7 items-center justify-center rounded-full bg-sheet">
          <MangoMark size={28} className="size-[22px]" />
        </span>
        <Wordmark className="text-xl" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="truncate font-semibold text-base leading-5">{name}</span>
        <div className="flex items-center justify-between gap-3 text-sm">
          {holder ? <span className="truncate text-ink/80">{holder}</span> : <span />}
          <span className="shrink-0 tnum tracking-[0.12em]">•••• {last4}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* Veredictos y etiquetas                                                                         */
/* ---------------------------------------------------------------------------------------------- */

export type Verdict = "approved" | "denied" | "pending";

const VERDICTS: Record<Verdict, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  approved: { label: "Aprobado", className: "bg-leaf-soft text-leaf", Icon: CheckCircle2 },
  denied: { label: "Rechazado", className: "bg-chili-soft text-chili", Icon: XCircle },
  pending: { label: "Espera tu OK", className: "bg-plum-soft text-plum", Icon: Clock3 },
};

/** Pill de veredicto. Leaf, chili y plum solo comunican decisiones del motor. */
export function StatusPill({
  verdict,
  label,
  className,
  size = "md",
}: {
  readonly verdict: Verdict;
  readonly label?: string;
  readonly className?: string;
  readonly size?: "sm" | "md";
}) {
  const v = VERDICTS[verdict];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold",
        size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-sm",
        v.className,
        className,
      )}
    >
      <v.Icon className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={2.2} />
      {label ?? v.label}
    </span>
  );
}

/** "SIMULADO": pill outline gris, 11px uppercase. Obligatorio en todo pago, carga o saldo simulado. */
export function SimTag({ className, children = "Simulado" }: { readonly className?: string; readonly children?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 ring-1 ring-line ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pill neutra para metadatos (permisos, contadores). Tinta translúcida, nunca color de veredicto. */
export function Chip({ className, children, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-ink/[0.05] px-2 text-xs font-semibold text-ink-2",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* Barra de progreso                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/** 6px, track tinta 8%, relleno tinta (no mango). */
export function ProgressBar({ value, max = 100, className }: { readonly value: number; readonly max?: number; readonly className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-settle" style={{ width: `${pct}%` }} />
    </div>
  );
}
