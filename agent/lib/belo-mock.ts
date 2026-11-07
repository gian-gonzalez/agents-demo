/**
 * Mock of a Belo Agentic Banking account (https://agentic.belo.app/).
 *
 * The real product is on a waitlist, so every tool in this project operates on
 * this in-memory account instead. The account lives in eve session state, so
 * balances and movements change as the conversation goes on and survive
 * restarts, but every new chat starts from the same seed.
 */
import { defineState } from "eve/context";

export type Currency = "ARS" | "USD" | "USDC" | "BTC";
export const CURRENCIES: Currency[] = ["ARS", "USD", "USDC", "BTC"];

export type MovementType = "card" | "fx" | "yield" | "ramp" | "transfer";

export interface Movement {
  id: string;
  date: string; // ISO
  type: MovementType;
  description: string;
  amount: number; // negative = money out
  currency: Currency;
  status: "completed" | "pending" | "frozen";
}

export interface Card {
  id: string;
  last4: string;
  label: string;
  status: "active" | "frozen";
  spentUsdThisMonth: number;
}

export interface Account {
  holder: string;
  balances: Record<Currency, number>;
  yieldApy: Record<Currency, number>;
  cards: Card[];
  activity: Movement[];
  counter: number;
}

/** Fixed mock rates, quoted as 1 unit of `base` in `quote`. */
export const FX_RATES: Record<string, number> = {
  "USD/ARS": 1485,
  "USDC/USD": 1,
  "USDC/ARS": 1485,
  "BTC/USD": 104250,
  "BTC/USDC": 104250,
  "BTC/ARS": 104250 * 1485,
};

export function fxRate(from: Currency, to: Currency): number {
  if (from === to) return 1;
  const direct = FX_RATES[`${from}/${to}`];
  if (direct !== undefined) return direct;
  const inverse = FX_RATES[`${to}/${from}`];
  if (inverse !== undefined) return 1 / inverse;
  throw new Error(`No hay cotización mock para ${from}/${to}`);
}

export function toUsd(amount: number, currency: Currency): number {
  return amount * fxRate(currency, "USD");
}

/** Merchants the mock risk engine flags. */
export const RISKY_MERCHANTS = ["casino", "bet", "apuestas", "crypto-mixer", "lottery"];

export function seedAccount(): Account {
  const day = (n: number) => `2026-11-${String(n).padStart(2, "0")}T14:30:00.000Z`;
  return {
    holder: "Cuenta belo (demo)",
    balances: { ARS: 1_250_000, USD: 3_420.5, USDC: 2_000, BTC: 0.0185 },
    yieldApy: { ARS: 0.32, USD: 0.045, USDC: 0.062, BTC: 0 },
    cards: [
      { id: "card_01", last4: "4821", label: "Tarjeta principal", status: "active", spentUsdThisMonth: 312.4 },
    ],
    activity: [
      { id: "mov_001", date: day(1), type: "yield", description: "Rendimiento diario USDC", amount: 0.34, currency: "USDC", status: "completed" },
      { id: "mov_002", date: day(2), type: "card", description: "Mercado Libre", amount: -48_900, currency: "ARS", status: "completed" },
      { id: "mov_003", date: day(3), type: "fx", description: "Compra USDC con ARS", amount: 500, currency: "USDC", status: "completed" },
      { id: "mov_004", date: day(3), type: "fx", description: "Compra USDC con ARS", amount: -742_500, currency: "ARS", status: "completed" },
      { id: "mov_005", date: day(4), type: "card", description: "Spotify", amount: -11.99, currency: "USD", status: "completed" },
      { id: "mov_006", date: day(5), type: "ramp", description: "Transferencia bancaria recibida", amount: 400_000, currency: "ARS", status: "completed" },
      { id: "mov_007", date: day(6), type: "card", description: "Aerolíneas Argentinas", amount: -300.41, currency: "USD", status: "completed" },
    ],
    counter: 7,
  };
}

/** Per-session account. Starts from the seed on every new conversation. */
export const account = defineState<Account>("belo.account", seedAccount);

export function nextId(prefix: string): string {
  let id = "";
  account.update((acc) => {
    const counter = acc.counter + 1;
    id = `${prefix}_${String(counter).padStart(3, "0")}`;
    return { ...acc, counter };
  });
  return id;
}

export function recordMovement(movement: Omit<Movement, "id">): Movement {
  const full: Movement = { id: nextId("mov"), ...movement };
  account.update((acc) => ({
    ...acc,
    balances: { ...acc.balances, [movement.currency]: acc.balances[movement.currency] + movement.amount },
    activity: [full, ...acc.activity],
  }));
  return full;
}

export function formatMoney(amount: number, currency: Currency): string {
  const digits = currency === "BTC" ? 6 : 2;
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";
  const symbol = currency === "ARS" ? "$" : currency === "USD" ? "US$" : `${currency} `;
  return `${sign}${symbol}${formatted}`;
}
