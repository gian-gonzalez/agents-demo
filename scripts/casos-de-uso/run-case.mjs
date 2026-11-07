// Corre un caso de uso (varios turnos en una sesión) contra el agente eve local como el agente
// indicado (header x-agent-id) y guarda un transcript en Markdown listo para mostrar.
// Uso (con `pnpm dev` / eve dev corriendo en :2000): node scripts/casos-de-uso/run-case.mjs scripts/casos-de-uso/caso-1.json
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.EVE_URL ?? "http://127.0.0.1:2000";
const PUBLIC_URL = "https://agents-demo-pied.vercel.app";
const caseFile = process.argv[2];
const c = JSON.parse(readFileSync(caseFile, "utf8"));
const headers = { "content-type": "application/json", "x-agent-id": c.agent.id };

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function readTurn(sessionId, n, timeoutMs = 150_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const res = await fetch(`${BASE}/eve/v1/session/${sessionId}/stream`, { headers, signal: ctrl.signal });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let settled = 0;
  const events = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        let e;
        try { e = JSON.parse(line); } catch { continue; }
        for (const f of e.facts ?? [e]) {
          const t = f.type;
          if (!t) continue;
          if (t === "turn.settled") {
            settled += 1;
            if (settled === n) { events.push(f); clearTimeout(timer); ctrl.abort(); return events; }
          } else if (settled === n - 1 && ["call.requested", "call.settled", "content.completed", "interaction.opened", "model.settled"].includes(t)) {
            events.push(f);
          }
        }
      }
    }
  } catch (e) {
    if (e.name !== "AbortError") throw e;
  } finally { clearTimeout(timer); }
  return events;
}

const lines = [];
lines.push(`# Caso de uso ${c.number}: ${c.title}`, "");
lines.push(c.summary, "");
lines.push(`**Agente:** ${c.agent.emoji} [${c.agent.name}](${PUBLIC_URL}/agents/${c.agent.id}) · límite US$${c.agent.cardLimitUsd} por operación${c.agent.monthlyBudgetUsd ? ` · presupuesto US$${c.agent.monthlyBudgetUsd}/mes` : ""}`, "");
lines.push("**Instrucciones que le dio su dueño:**", "");
lines.push(c.agent.instructions.split("\n").map((l) => `> ${l}`).join("\n>\n"));
lines.push("", `**Permisos belo:** ${c.agent.permissions.map((p) => `\`${p}\``).join(", ")}`, "");
lines.push("---", "", "## Conversación", "");

let sessionId;
for (let i = 0; i < c.turns.length; i++) {
  const message = c.turns[i];
  const started = Date.now();
  if (!sessionId) ({ sessionId } = await post("/eve/v1/session", { message }));
  else await post(`/eve/v1/session/${sessionId}`, { message });
  const events = await readTurn(sessionId, i + 1);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  lines.push(`### ${i + 1}. 🧑 ${message}`, "");
  const tools = [];
  for (const f of events) {
    const d = f.data ?? {};
    if (f.type === "call.requested") tools.push({ id: d.callId, label: d.capability?.label ?? d.capability?.name, name: d.capability?.name, input: d.input });
    if (f.type === "call.settled") {
      const t = tools.find((x) => x.id === d.callId);
      if (t) t.result = d.outcome === "completed" ? "✅ ejecutado" : `⛔ ${d.error?.message ?? d.reason ?? d.outcome}`;
    }
    if (f.type === "interaction.opened") lines.push(`> ⚠️ Pidió aprobación: ${d.request?.prompt}`, "");
    if (f.type === "model.settled" && d.outcome === "failed") lines.push(`> ❌ Error del modelo: ${d.error?.message ?? JSON.stringify(d.error)}`, "");
    if (f.type === "content.completed" && d.phase === "reply") {
      if (tools.length) {
        for (const t of tools) lines.push(`- 🔧 \`${t.name}\` ${t.label} → ${t.result ?? "sin resultado"}`);
        lines.push("");
      }
      lines.push(`🤖 ${d.value.split("\n").join("\n")}`, "");
    }
  }
  lines.push(`<sub>${secs}s</sub>`, "");
  writeFileSync(new URL(`../../${c.out}`, import.meta.url), lines.join("\n"));
  console.log(`[${c.number}] turno ${i + 1}/${c.turns.length} (${secs}s)`);
}
lines.push("---", "", `_Generado el ${new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} contra la cuenta belo simulada. Los saldos vuelven a la semilla en cada conversación; el gasto del presupuesto mensual es real y persiste._`);
writeFileSync(new URL(`../../${c.out}`, import.meta.url), lines.join("\n"));
console.log("DONE", c.out);
// Actualiza el módulo que lee la web (apps/web/content/casos.generated.ts).
await import("./build-content.mjs");
