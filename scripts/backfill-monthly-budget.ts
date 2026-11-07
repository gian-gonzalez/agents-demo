/**
 * Backfill: agents created before the monthly budget existed, whose
 * instructions state a monthly cap ("USD 100 por mes"), get that cap as a
 * real `monthly_budget_usd`. Agents without a recognizable cap are left alone.
 *
 * Run from the repo root with the database env loaded:
 *   set -a; . ./.env.local; set +a
 *   pnpm db:backfill-budget
 *
 * Pass --dry-run to only print what would change.
 */
import { neon } from "@neondatabase/serverless";
import { inferMonthlyBudgetUsd } from "../apps/web/lib/budget-from-instructions.ts";

const dryRun = process.argv.includes("--dry-run");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Cargá .env.local primero: set -a; . ./.env.local; set +a");
  process.exit(1);
}

const sql = neon(url);
const rows = (await sql`select id, name, instructions from agents where monthly_budget_usd is null order by created_at`) as {
  id: string;
  name: string;
  instructions: string;
}[];

let changed = 0;
for (const row of rows) {
  const budget = inferMonthlyBudgetUsd(row.instructions);
  if (budget == null) {
    console.log(`sin tope   ${row.name}`);
    continue;
  }
  if (!dryRun) await sql`update agents set monthly_budget_usd = ${budget} where id = ${row.id}`;
  changed += 1;
  console.log(`${dryRun ? "haría" : "listo"}      ${row.name} -> US$${budget}/mes`);
}
console.log(`${changed} agente(s) ${dryRun ? "por actualizar" : "actualizado(s)"} de ${rows.length} sin tope.`);
