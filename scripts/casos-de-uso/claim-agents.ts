/**
 * Pone a los dos agentes de los casos de ejemplo a nombre de un usuario real de la plataforma
 * (hoy figuran como "Dev local" porque se crearon desde el entorno local).
 *
 *   set -a; . ./.env.local; set +a
 *   pnpm casos:claim "<owner_id>"          # el owner_id de uno de tus agentes en la tabla agents
 */
import { neon } from "@neondatabase/serverless";
import { SHOWCASE_CASES } from "../../apps/web/lib/showcase.ts";

const ownerId = process.argv[2];
const url = process.env.DATABASE_URL;
if (!url || !ownerId) {
  console.error("Uso: DATABASE_URL cargado y pnpm casos:claim <owner_id>");
  process.exit(1);
}
const sql = neon(url);
const [owner] = (await sql`select owner_id, owner_name, owner_email, owner_image from agents where owner_id = ${ownerId} limit 1`) as {
  owner_id: string; owner_name: string; owner_email: string; owner_image: string | null;
}[];
if (!owner) {
  console.error(`No hay agentes con owner_id ${ownerId}. Creá un agente con tu cuenta primero.`);
  process.exit(1);
}
for (const c of SHOWCASE_CASES) {
  await sql`update agents set owner_id = ${owner.owner_id}, owner_name = ${owner.owner_name}, owner_email = ${owner.owner_email}, owner_image = ${owner.owner_image} where id = ${c.agentId}`;
  console.log(`listo  ${c.agentName} -> ${owner.owner_name}`);
}
