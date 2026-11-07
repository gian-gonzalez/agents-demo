/**
 * Belo Agentic Banking capabilities as eve tools, over the mock account.
 *
 * `buildBeloTools(profile)` returns only the tools the agent's owner granted.
 * Every operation that moves money is gated on human approval: the agent
 * proposes, the person decides.
 */
import { defineTool, type DynamicToolEntry } from "eve/tools";
import { never } from "eve/tools/approval";
import { z } from "zod";
import {
  CURRENCIES,
  RISKY_MERCHANTS,
  account,
  formatMoney,
  fxRate,
  nextId,
  recordMovement,
  toUsd,
  type Currency,
} from "./belo-mock";
import { budgetStatus, formatUsd } from "./budget";
import type { AgentProfile, BeloPermission } from "./profile";
import { getStore } from "../../apps/web/lib/db/store.js";

const currencySchema = z.enum(["ARS", "USD", "USDC", "BTC"]);

function usdEquivalent(balances: Record<Currency, number>): number {
  return CURRENCIES.reduce((sum, c) => sum + toUsd(balances[c], c), 0);
}

export function buildBeloTools(profile: AgentProfile) {
  const granted = new Set<BeloPermission>(profile.permissions);
  const tools: Record<string, DynamicToolEntry> = {};

  if (granted.has("account.balances")) {
    tools.account_balances = defineTool({
      description:
        "Consulta los saldos de la cuenta belo del usuario en cada moneda (ARS, USD, USDC, BTC) y su equivalente total en USD.",
      inputSchema: z.object({}),
      label: { start: () => "Consultar saldos" },
      approval: never(),
      async execute() {
        const acc = account.get();
        return {
          holder: acc.holder,
          balances: CURRENCIES.map((c) => ({
            currency: c,
            amount: acc.balances[c],
            formatted: formatMoney(acc.balances[c], c),
            usdEquivalent: Math.round(toUsd(acc.balances[c], c) * 100) / 100,
          })),
          totalUsd: Math.round(usdEquivalent(acc.balances) * 100) / 100,
        };
      },
    });
  }

  if (granted.has("account.yields")) {
    tools.account_yields = defineTool({
      description:
        "Muestra el rendimiento anual (APY) que genera cada saldo y una estimación de lo ganado por día y por mes.",
      inputSchema: z.object({}),
      label: { start: () => "Consultar rendimientos" },
      approval: never(),
      async execute() {
        const acc = account.get();
        return CURRENCIES.filter((c) => acc.yieldApy[c] > 0).map((c) => {
          const daily = (acc.balances[c] * acc.yieldApy[c]) / 365;
          return {
            currency: c,
            apy: acc.yieldApy[c],
            apyFormatted: `${(acc.yieldApy[c] * 100).toFixed(1)}%`,
            estimatedDaily: formatMoney(daily, c),
            estimatedMonthly: formatMoney(daily * 30, c),
          };
        });
      },
    });
  }

  if (granted.has("account.activity")) {
    tools.account_activity = defineTool({
      description: "Lista los últimos movimientos de la cuenta, opcionalmente filtrados por tipo.",
      inputSchema: z.object({
        type: z.enum(["card", "fx", "yield", "ramp", "transfer"]).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      label: { start: ({ limit }) => `Ver últimos ${limit} movimientos` },
      approval: never(),
      async execute({ type, limit }) {
        const acc = account.get();
        return acc.activity
          .filter((m) => (type ? m.type === type : true))
          .slice(0, limit)
          .map((m) => ({ ...m, formatted: formatMoney(m.amount, m.currency) }));
      },
    });
  }

  if (granted.has("exchange.fx")) {
    tools.exchange_fx = defineTool({
      description:
        "Ejecuta un cambio de moneda dentro de la cuenta (por ejemplo ARS → USDC). Se ejecuta en el acto, sin pedir confirmación.",
      inputSchema: z.object({
        from: currencySchema,
        to: currencySchema,
        amount: z.number().positive().describe("Monto en la moneda de origen"),
      }),
      label: { start: ({ from, to, amount }) => `Cambiar ${formatMoney(amount, from)} a ${to}` },
      approval: never(),
      async execute({ from, to, amount }) {
        if (from === to) throw new Error("La moneda de origen y destino son iguales.");
        const acc = account.get();
        if (acc.balances[from] < amount) {
          throw new Error(`Saldo insuficiente en ${from}: ${formatMoney(acc.balances[from], from)}.`);
        }
        const rate = fxRate(from, to);
        const received = amount * rate;
        recordMovement({ date: new Date().toISOString(), type: "fx", description: `Cambio ${from} → ${to}`, amount: -amount, currency: from, status: "completed" });
        recordMovement({ date: new Date().toISOString(), type: "fx", description: `Cambio ${from} → ${to}`, amount: received, currency: to, status: "completed" });
        return { status: "completed", rate, sent: formatMoney(amount, from), received: formatMoney(received, to) };
      },
    });
  }

  if (granted.has("ramp.fiat_crypto")) {
    tools.ramp_fiat_crypto = defineTool({
      description:
        "Ejecuta un on-ramp (fiat → crypto) u off-ramp (crypto → fiat) con una cuenta bancaria externa. Disponible en LATAM, no en US/EU. Se ejecuta en el acto.",
      inputSchema: z.object({
        direction: z.enum(["on", "off"]).describe("on: fiat → crypto, off: crypto → fiat"),
        fiat: z.enum(["ARS", "USD"]),
        crypto: z.enum(["USDC", "BTC"]),
        amount: z.number().positive().describe("Monto en la moneda de origen"),
        method: z.enum(["transferencia_bancaria", "pix"]).default("transferencia_bancaria"),
      }),
      label: { start: ({ direction }) => (direction === "on" ? "On-ramp" : "Off-ramp") },
      approval: never(),
      async execute({ direction, fiat, crypto, amount, method }) {
        if (direction === "on") {
          const received = amount * fxRate(fiat, crypto);
          recordMovement({ date: new Date().toISOString(), type: "ramp", description: `On-ramp ${method} → ${crypto}`, amount: received, currency: crypto, status: "pending" });
          return { status: "pending", note: "El depósito bancario se acredita en minutos (mock).", received: formatMoney(received, crypto) };
        }
        const acc = account.get();
        if (acc.balances[crypto] < amount) {
          throw new Error(`Saldo insuficiente en ${crypto}: ${formatMoney(acc.balances[crypto], crypto)}.`);
        }
        recordMovement({ date: new Date().toISOString(), type: "ramp", description: `Off-ramp ${crypto} → cuenta bancaria ${fiat}`, amount: -amount, currency: crypto, status: "pending" });
        return { status: "pending", sent: formatMoney(amount, crypto), willReceive: formatMoney(amount * fxRate(crypto, fiat), fiat) };
      },
    });
  }

  if (granted.has("card.manage")) {
    tools.card_manage = defineTool({
      description:
        "Gestiona las tarjetas belo: listar, emitir una nueva, congelar o descongelar. Todo se ejecuta en el acto.",
      inputSchema: z.object({
        action: z.enum(["list", "issue", "freeze", "unfreeze"]),
        cardId: z.string().optional().describe("Requerido para freeze/unfreeze"),
        label: z.string().optional().describe("Nombre de la tarjeta al emitir"),
      }),
      label: {
        start: ({ action, label }) =>
          action === "issue" ? `Emitir tarjeta ${label ?? ""}`.trim() : action === "list" ? "Listar tarjetas" : `${action === "freeze" ? "Congelar" : "Descongelar"} tarjeta`,
      },
      approval: never(),
      async execute({ action, cardId, label }) {
        if (action === "list") {
          return account.get().cards.map((c) => ({ ...c, limitUsd: profile.cardLimitUsd }));
        }
        if (action === "issue") {
          const id = nextId("card");
          const last4 = String(1000 + Math.floor(Math.random() * 9000));
          account.update((acc) => ({
            ...acc,
            cards: [...acc.cards, { id, last4, label: label ?? "Tarjeta virtual", status: "active", spentUsdThisMonth: 0 }],
          }));
          return { status: "issued", cardId: id, last4, limitUsd: profile.cardLimitUsd };
        }
        const card = account.get().cards.find((c) => c.id === cardId);
        if (!card) throw new Error(`No existe la tarjeta ${cardId}. Usá action "list" para ver las disponibles.`);
        const status = action === "freeze" ? "frozen" : "active";
        account.update((acc) => ({ ...acc, cards: acc.cards.map((c) => (c.id === cardId ? { ...c, status } : c)) }));
        return { status, cardId, last4: card.last4 };
      },
    });
  }

  if (granted.has("transaction.approve")) {
    tools.transaction_pay = defineTool({
      description:
        "Paga con tarjeta belo a un comercio, en el acto y sin pedir confirmación. Antes corre un chequeo de riesgo, el límite por operación y el presupuesto mensual del agente (gasto acumulado entre todas las conversaciones); si alguno falla, el sistema rechaza el pago.",
      inputSchema: z.object({
        merchant: z.string().min(1),
        amountUsd: z.number().positive(),
        cardId: z.string().optional(),
        memo: z.string().optional(),
      }),
      label: { start: ({ merchant, amountUsd }) => `Pagar US$${amountUsd.toFixed(2)} a ${merchant}` },
      approval: {
        request: async ({ toolInput }) => {
          const merchant = String(toolInput?.merchant ?? "").toLowerCase();
          const amount = Number(toolInput?.amountUsd ?? 0);
          if (RISKY_MERCHANTS.some((r) => merchant.includes(r))) {
            return { type: "denied", reason: `RISK_CHECK_FAILED: el comercio "${toolInput?.merchant}" está bloqueado por la política de riesgo.` };
          }
          if (amount > profile.cardLimitUsd) {
            return { type: "denied", reason: `LIMIT_EXCEEDED: el límite de este agente es US$${profile.cardLimitUsd} y el pago es US$${amount.toFixed(2)}.` };
          }
          // Presupuesto mensual real: suma de pagos ejecutados por este agente en el mes, en todas las sesiones.
          const budget = await budgetStatus(profile);
          if (budget.budgetUsd != null && budget.remainingUsd != null && amount > budget.remainingUsd) {
            return {
              type: "denied",
              reason:
                `BUDGET_EXCEEDED: el presupuesto mensual de este agente es ${formatUsd(budget.budgetUsd)}, ` +
                `ya gastó ${formatUsd(budget.spentUsd)} este mes y le quedan ${formatUsd(budget.remainingUsd)}; el pago es ${formatUsd(amount)}.`,
            };
          }
          // Pasó riesgo, límite y presupuesto: se ejecuta solo, sin confirmación humana.
          return "approved";
        },
      },
      async execute({ merchant, amountUsd, cardId, memo }, ctx) {
        const acc = account.get();
        const card = cardId ? acc.cards.find((c) => c.id === cardId) : acc.cards.find((c) => c.status === "active");
        if (!card) throw new Error("No hay una tarjeta activa para pagar.");
        if (card.status === "frozen") throw new Error(`La tarjeta ····${card.last4} está congelada.`);
        const currency: Currency = acc.balances.USD >= amountUsd ? "USD" : "USDC";
        if (acc.balances[currency] < amountUsd) {
          throw new Error(`Saldo insuficiente: USD ${formatMoney(acc.balances.USD, "USD")}, USDC ${formatMoney(acc.balances.USDC, "USDC")}.`);
        }
        const movement = recordMovement({
          date: new Date().toISOString(),
          type: "card",
          description: memo ? `${merchant} · ${memo}` : merchant,
          amount: -amountUsd,
          currency,
          status: "completed",
        });
        account.update((a) => ({
          ...a,
          cards: a.cards.map((c) => (c.id === card.id ? { ...c, spentUsdThisMonth: c.spentUsdThisMonth + amountUsd } : c)),
        }));
        const remaining = account.get().balances[currency];
        const dailyYield = (remaining * account.get().yieldApy[currency]) / 365;

        // Registra el gasto real del agente (persistente entre sesiones) para el presupuesto mensual.
        let budget: Record<string, string> = {};
        if (profile.id !== "demo") {
          try {
            await getStore().recordSpend({
              agentId: profile.id,
              sessionId: ctx.session.id,
              merchant,
              amountUsd,
              movementId: movement.id,
            });
            const status = await budgetStatus(profile);
            budget =
              status.budgetUsd == null
                ? { spentThisMonth: formatUsd(status.spentUsd), monthlyBudget: "sin tope" }
                : {
                    spentThisMonth: formatUsd(status.spentUsd),
                    monthlyBudget: formatUsd(status.budgetUsd),
                    budgetRemaining: formatUsd(status.remainingUsd ?? 0),
                  };
          } catch (error) {
            console.warn("No se pudo registrar el gasto del agente", { agentId: profile.id, error });
          }
        }

        return {
          status: "APPROVED_AND_EXECUTED",
          movementId: movement.id,
          card: `····${card.last4}`,
          chargedFrom: currency,
          amount: formatMoney(-amountUsd, currency),
          remainingBalance: formatMoney(remaining, currency),
          yieldOnRemaining: `${formatMoney(dailyYield, currency)} por día`,
          ...budget,
        };
      },
    });
  }

  return tools;
}
