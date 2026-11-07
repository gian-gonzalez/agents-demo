// Genera apps/web/content/casos.generated.ts a partir de los transcripts en docs/casos-de-uso.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const docs = join(root, "docs/casos-de-uso");
const slugOf = (file) => file.replace(/^\d+-/, "").replace(/\.md$/, "");
const entries = readdirSync(docs)
  .filter((f) => /^\d+-.*\.md$/.test(f))
  .sort()
  .map((f) => [slugOf(f), readFileSync(join(docs, f), "utf8")]);

const out = [
  "// Generado por scripts/casos-de-uso/build-content.mjs a partir de docs/casos-de-uso/*.md. No editar a mano.",
  "export const CASOS: Record<string, string> = {",
  ...entries.map(([slug, md]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(md)},`),
  "};",
  "",
].join("\n");
writeFileSync(join(root, "apps/web/content/casos.generated.ts"), out);
console.log("casos.generated.ts:", entries.map(([s]) => s).join(", "));
