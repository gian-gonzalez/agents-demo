/**
 * Infers a monthly budget in USD from free-text instructions, so a rule like
 * "manejás USD 100 por mes" becomes a real, enforced budget even when the
 * owner left the "Presupuesto mensual" field empty.
 *
 * Conservative on purpose: it only looks inside clauses that talk about a
 * month ("por mes", "al mes", "mensual", "/mes") and needs either a currency
 * marker (USD, US$, $, dólares) or a budget word (presupuesto, tope, límite,
 * gastar) next to the number. Returns the first match, as a whole number.
 */
const MONTH = /\b(?:por|al|cada|x)\s+mes\b|\/\s*mes\b|\bmensual(?:es|mente)?\b|\bpor\s+mes\b|\bdel\s+mes\b/i;
const CURRENCY_BEFORE = /(?:US\$|U\$S|USD|U\$D|\$)\s*(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,](\d{1,2}))?\b/i;
const CURRENCY_AFTER = /\b(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,](\d{1,2}))?\s*(?:USD|US\$|U\$S|U\$D|d[oó]lares|usd|dolar(?:es)?|verdes)\b/i;
const BUDGET_WORD = /\b(?:presupuesto|tope|l[ií]mite|gast(?:ar|o|os|á|es)|wallet|billetera|fondos?)(?![a-z])/i;
const BARE_NUMBER = /\b(\d{1,3}(?:[.,]\d{3})+|\d{2,6})\b/;

function parseAmount(whole: string, decimals?: string): number | null {
  // "1.000" / "1,000" are thousands in es-AR and en-US alike; a 1-2 digit tail is decimals.
  const integer = Number(whole.replace(/[.,]/g, ""));
  if (!Number.isFinite(integer)) return null;
  const value = decimals ? integer + Number(`0.${decimals}`) : integer;
  return value > 0 ? Math.round(value) : null;
}

export function inferMonthlyBudgetUsd(instructions: string): number | null {
  // Clauses: sentences, lines and bullet items.
  const clauses = instructions.split(/(?<=[.;!?\n])\s+|\n+|\s+-\s+|\s+•\s+/);
  for (const clause of clauses) {
    if (!MONTH.test(clause)) continue;
    const before = CURRENCY_BEFORE.exec(clause);
    if (before) return parseAmount(before[1], before[2]);
    const after = CURRENCY_AFTER.exec(clause);
    if (after) return parseAmount(after[1], after[2]);
    if (BUDGET_WORD.test(clause)) {
      const bare = BARE_NUMBER.exec(clause);
      if (bare) return parseAmount(bare[1]);
    }
  }
  return null;
}
