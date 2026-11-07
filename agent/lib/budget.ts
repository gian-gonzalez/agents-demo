/**
 * The agent's real monthly budget.
 *
 * Unlike the mock account (which restarts on every conversation), spend is
 * recorded in the store and summed across every session of the agent for the
 * current calendar month. `transaction_pay` denies a payment that would
 * exceed the budget and records each executed payment.
 */
import { getStore } from "../../apps/web/lib/db/store.js";
import type { AgentProfile } from "./profile";

export interface BudgetStatus {
  /** Monthly cap in USD, or null when the owner set none. */
  budgetUsd: number | null;
  /** USD spent this calendar month across all sessions. */
  spentUsd: number;
  /** USD still available this month, or null when there is no cap. */
  remainingUsd: number | null;
}

export async function budgetStatus(profile: AgentProfile): Promise<BudgetStatus> {
  const budgetUsd = profile.monthlyBudgetUsd;
  // The demo profile is not a stored agent: no spend to look up.
  const spentUsd = profile.id === "demo" ? 0 : await getStore().monthlySpend(profile.id);
  return {
    budgetUsd,
    spentUsd: round2(spentUsd),
    remainingUsd: budgetUsd == null ? null : round2(Math.max(0, budgetUsd - spentUsd)),
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatUsd(value: number): string {
  return `US$${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}
