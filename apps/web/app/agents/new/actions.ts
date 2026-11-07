"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { BELO_PERMISSIONS, EMOJI_PRESETS } from "@/lib/belo";
import { getCurrentUser } from "@/lib/current-user";
import { inferMonthlyBudgetUsd } from "@/lib/budget-from-instructions";
import { getStore } from "@/lib/db/store";

export interface NewAgentFormState {
  readonly errors?: Readonly<Record<string, string>>;
  readonly values?: Readonly<Record<string, string | string[]>>;
}

const schema = z.object({
  emoji: z.enum(EMOJI_PRESETS),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(40, "Máximo 40 caracteres"),
  description: z.string().trim().min(10, "Contá en una línea qué hace").max(140, "Máximo 140 caracteres"),
  instructions: z.string().trim().min(20, "Dale al menos una instrucción concreta").max(4000, "Máximo 4000 caracteres"),
  permissions: z.array(z.enum(BELO_PERMISSIONS)).min(1, "Habilitá al menos un permiso"),
  cardLimitUsd: z.coerce.number().int("Usá un número entero").min(1, "Mínimo US$1").max(10000, "Máximo US$10.000"),
  monthlyBudgetUsd: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().int("Usá un número entero").min(1, "Mínimo US$1").max(100000, "Máximo US$100.000").nullable(),
  ),
  visibility: z.enum(["public", "unlisted"]),
});

export async function createAgentAction(
  _previous: NewAgentFormState,
  formData: FormData,
): Promise<NewAgentFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Tenés que iniciar sesión con Vercel para crear un agente." } };

  const raw = {
    emoji: formData.get("emoji"),
    name: formData.get("name"),
    description: formData.get("description"),
    instructions: formData.get("instructions"),
    permissions: formData.getAll("permissions"),
    cardLimitUsd: formData.get("cardLimitUsd"),
    monthlyBudgetUsd: formData.get("monthlyBudgetUsd"),
    visibility: formData.get("visibility"),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return {
      errors,
      values: Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.map(String) : typeof value === "string" ? value : "",
        ]),
      ),
    };
  }

  // Si el campo quedó vacío pero las instrucciones fijan un tope mensual ("USD 100 por mes"),
  // ese tope se vuelve real: el sistema lo aplica, no solo el modelo.
  const monthlyBudgetUsd = parsed.data.monthlyBudgetUsd ?? inferMonthlyBudgetUsd(parsed.data.instructions);

  const agent = await getStore().createAgent({
    ...parsed.data,
    monthlyBudgetUsd,
    owner: { id: user.id, name: user.name, email: user.email, image: user.image },
  });

  redirect(`/agents/${encodeURIComponent(agent.id)}`);
}
