/**
 * An agent created by a user of the platform.
 *
 * Each row in the `agents` table becomes one of these at runtime: the
 * dynamic instructions and tools read it to turn the single eve root agent
 * into "that user's agent" for the current session.
 */
export interface AgentProfile {
  id: string;
  name: string;
  emoji: string;
  description: string;
  instructions: string;
  /** Belo capability IDs the owner granted, e.g. "account.balances". */
  permissions: BeloPermission[];
  /** Per-operation card limit in USD the owner set for this agent. */
  cardLimitUsd: number;
  /** Monthly spending cap in USD across every conversation; null = no cap. */
  monthlyBudgetUsd: number | null;
  ownerId: string;
  ownerName: string;
}

export const BELO_PERMISSIONS = [
  "account.balances",
  "account.yields",
  "account.activity",
  "exchange.fx",
  "ramp.fiat_crypto",
  "card.manage",
  "transaction.approve",
] as const;

export type BeloPermission = (typeof BELO_PERMISSIONS)[number];

export const BELO_PERMISSION_LABELS: Record<BeloPermission, string> = {
  "account.balances": "Consultar saldos",
  "account.yields": "Recibir rendimientos",
  "account.activity": "Ver actividad",
  "exchange.fx": "Cambio de monedas",
  "ramp.fiat_crypto": "On/off-ramp fiat ↔ crypto",
  "card.manage": "Emitir, usar y congelar tarjeta",
  "transaction.approve": "Pagar con tarjeta (automático)",
};

export function isBeloPermission(value: unknown): value is BeloPermission {
  return typeof value === "string" && (BELO_PERMISSIONS as readonly string[]).includes(value);
}
