/**
 * Casos de ejemplo que se muestran en la home: agentes reales de la plataforma
 * (visibilidad "por enlace") con una conversación guardada en docs/casos-de-uso.
 * El texto de cada conversación vive en content/casos.generated.ts, que genera
 * scripts/casos-de-uso/run-case.mjs.
 */
export interface ShowcaseCase {
  slug: string;
  number: number;
  emoji: string;
  title: string;
  agentId: string;
  agentName: string;
  /** Qué demuestra, en una línea. */
  blurb: string;
  /** Qué mirar durante la demo. */
  highlights: string[];
}

export const SHOWCASE_CASES: ShowcaseCase[] = [
  {
    slug: "tesorero-del-equipo",
    number: 1,
    emoji: "🧾",
    title: "El tesorero del equipo",
    agentId: "tAnadXCkN6",
    agentName: "Tesorero del equipo",
    blurb: "Paga las herramientas del equipo con US$300 por mes escritos en sus instrucciones. El presupuesto es real: se acumula entre conversaciones y el motor frena lo que lo supere.",
    highlights: ["Presupuesto detectado del texto", "Solo software, nada físico", "Paga solo, sin confirmación"],
  },
  {
    slug: "ahorrista-en-dolares",
    number: 2,
    emoji: "🪙",
    title: "La ahorrista en dólares",
    agentId: "e3ZSfLIp0w",
    agentName: "Ahorrista en dólares",
    blurb: "Convierte pesos a USDC porque rinde más, hace on/off-ramp con el banco y dice cuánto rinde cada movimiento. Regla dura: nunca bitcoin.",
    highlights: ["Cambio de moneda y ramps", "Rendimiento por mes", "Respeta una regla dura"],
  },
];

export function findShowcaseCase(slug: string): ShowcaseCase | undefined {
  return SHOWCASE_CASES.find((c) => c.slug === slug);
}
