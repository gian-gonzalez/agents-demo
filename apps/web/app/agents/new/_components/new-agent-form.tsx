"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { SimTag } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BELO_PERMISSIONS, BELO_PERMISSION_LABELS, EMOJI_PRESETS } from "@/lib/belo";
import { cn } from "@/lib/utils";
import { createAgentAction, type NewAgentFormState } from "../actions";

const DEFAULT_PERMISSIONS: readonly string[] = BELO_PERMISSIONS.filter((p) => p !== "ramp.fiat_crypto");

const INSTRUCTIONS_PLACEHOLDER =
  "Sos mi asistente de gastos. Cuando te pida pagar algo, chequeá el saldo primero y proponé el pago con la tarjeta principal. Si un gasto supera US$200, preguntame antes de proponerlo.";

export function NewAgentForm() {
  const [state, action, pending] = useActionState<NewAgentFormState, FormData>(createAgentAction, {});
  const values = state.values ?? {};
  const errors = state.errors ?? {};
  const str = (key: string, fallback = "") => {
    const value = values[key];
    return typeof value === "string" ? value : fallback;
  };
  const selectedPermissions = Array.isArray(values.permissions) ? values.permissions : DEFAULT_PERMISSIONS;

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Identidad */}
      <Section title="Identidad">
        <Field error={errors.emoji} label="Ícono">
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {EMOJI_PRESETS.map((emoji) => (
              <label
                className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-ink/[0.05] text-xl transition-[background-color,box-shadow] duration-200 ease-settle hover:bg-ink/[0.08] has-checked:bg-mango-soft has-checked:ring-1 has-checked:ring-mango has-focus-visible:ring-2 has-focus-visible:ring-ink"
                key={emoji}
              >
                <input
                  className="sr-only"
                  defaultChecked={str("emoji", "🤖") === emoji}
                  name="emoji"
                  type="radio"
                  value={emoji}
                />
                <span aria-hidden="true">{emoji}</span>
                <span className="sr-only">{emoji}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field error={errors.name} hint="Máx. 40 caracteres" htmlFor="name" label="Nombre">
          <Input
            aria-invalid={Boolean(errors.name)}
            defaultValue={str("name")}
            id="name"
            maxLength={40}
            name="name"
            placeholder="Asistente de gastos"
            required
          />
        </Field>

        <Field
          error={errors.description}
          hint="Máx. 140 caracteres. Es lo que se ve en la tarjeta."
          htmlFor="description"
          label="Descripción"
        >
          <Input
            aria-invalid={Boolean(errors.description)}
            defaultValue={str("description")}
            id="description"
            maxLength={140}
            name="description"
            placeholder="Controla mis gastos del mes y propone pagos con la tarjeta."
            required
          />
        </Field>
      </Section>

      {/* Instrucciones */}
      <Section title="Instrucciones">
        <Field
          error={errors.instructions}
          hint="Hablale como a una persona. Esto es lo que el agente va a seguir."
          htmlFor="instructions"
          label="Qué tiene que hacer"
        >
          <Textarea
            aria-invalid={Boolean(errors.instructions)}
            className="min-h-36"
            defaultValue={str("instructions")}
            id="instructions"
            maxLength={4000}
            name="instructions"
            placeholder={INSTRUCTIONS_PLACEHOLDER}
            required
          />
        </Field>
      </Section>

      {/* Permisos: lista estilo ajustes, checkbox a la derecha */}
      <Section
        hint="Capacidades de belo que el agente puede usar. Todo lo que mueve plata requiere tu aprobación igual."
        tag={<SimTag />}
        title="Permisos belo"
      >
        <ul className="-mx-4 -my-4 divide-y divide-line">
          {BELO_PERMISSIONS.map((permission) => (
            <li key={permission}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors duration-200 hover:bg-ink/[0.03]">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink text-sm leading-5">{BELO_PERMISSION_LABELS[permission]}</span>
                  <span className="block text-ink-3 text-xs leading-4">{permission}</span>
                </span>
                <span className="relative flex size-6 shrink-0 items-center justify-center">
                  <input
                    className="peer size-6 cursor-pointer appearance-none rounded-full bg-ink/[0.05] ring-1 ring-line ring-inset transition-[background-color,box-shadow] duration-200 ease-settle checked:bg-ink checked:ring-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    defaultChecked={selectedPermissions.includes(permission)}
                    name="permissions"
                    type="checkbox"
                    value={permission}
                  />
                  <CheckIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute size-3.5 text-paper opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
                    strokeWidth={3}
                  />
                </span>
              </label>
            </li>
          ))}
        </ul>
        {errors.permissions ? (
          <p className="pt-3 text-chili text-xs" role="alert">
            {errors.permissions}
          </p>
        ) : null}
      </Section>

      {/* Límites y visibilidad */}
      <Section title="Límites y visibilidad">
        <Field
          error={errors.cardLimitUsd}
          hint="Por operación, en dólares."
          htmlFor="cardLimitUsd"
          label="Límite de tarjeta (US$)"
        >
          <Input
            aria-invalid={Boolean(errors.cardLimitUsd)}
            className="text-[20px] font-semibold"
            defaultValue={str("cardLimitUsd", "500")}
            id="cardLimitUsd"
            inputMode="numeric"
            max={10000}
            min={1}
            name="cardLimitUsd"
            required
            step={1}
            type="number"
          />
        </Field>

        <Field
          error={errors.monthlyBudgetUsd}
          hint="Tope real de gasto por mes, sumando todas las conversaciones. Si lo dejás vacío y en las instrucciones decís algo como “USD 100 por mes”, lo tomamos de ahí."
          htmlFor="monthlyBudgetUsd"
          label="Presupuesto mensual (US$)"
        >
          <Input
            aria-invalid={Boolean(errors.monthlyBudgetUsd)}
            className="text-[20px] font-semibold"
            defaultValue={str("monthlyBudgetUsd", "")}
            id="monthlyBudgetUsd"
            inputMode="numeric"
            max={100000}
            min={1}
            name="monthlyBudgetUsd"
            placeholder="Sin tope"
            step={1}
            type="number"
          />
        </Field>

        <Field error={errors.visibility} label="Visibilidad">
          <div className="flex gap-1 rounded-full bg-ink/[0.05] p-1" role="radiogroup">
            {[
              { value: "public", label: "Público", hint: "Aparece en el feed" },
              { value: "unlisted", label: "Por enlace", hint: "Solo con el link" },
            ].map((option) => (
              <label
                className="flex h-10 flex-1 cursor-pointer flex-col items-center justify-center rounded-full text-ink-2 transition-[background-color,color,box-shadow] duration-200 ease-settle has-checked:bg-sheet has-checked:text-ink has-checked:ring-1 has-checked:ring-line has-focus-visible:ring-2 has-focus-visible:ring-ink"
                key={option.value}
                title={option.hint}
              >
                <input
                  className="sr-only"
                  defaultChecked={str("visibility", "public") === option.value}
                  name="visibility"
                  type="radio"
                  value={option.value}
                />
                <span className="font-semibold text-sm leading-4">{option.label}</span>
                <span className="text-[11px] text-ink-3 leading-3">{option.hint}</span>
              </label>
            ))}
          </div>
        </Field>
      </Section>

      {errors.form ? (
        <p className="rounded-2xl bg-chili-soft px-4 py-3 text-chili text-sm" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
        {/* Única acción mango de la pantalla */}
        <Button className="w-full sm:flex-1" disabled={pending} size="lg" type="submit">
          {pending ? "Creando…" : "Crear agente"}
        </Button>
        <Button asChild className="w-full sm:flex-1" size="lg" variant="secondary">
          <Link href="/">Volver</Link>
        </Button>
        <p className="text-center text-ink-3 text-xs">El agente propone. Vos decidís.</p>
      </div>
    </form>
  );
}

/** Superficie blanca que agrupa campos: ring hairline, divisores entre campos. */
function Section({
  title,
  hint,
  tag,
  children,
}: {
  readonly title: string;
  readonly hint?: string;
  readonly tag?: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rise">
      <header className="flex flex-col gap-1 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-[20px] leading-6 tracking-[-0.01em]">{title}</h2>
          {tag}
        </div>
        {hint ? <p className="text-ink-3 text-xs leading-4">{hint}</p> : null}
      </header>
      <div className="flex flex-col divide-y divide-line rounded-2xl bg-sheet p-4 ring-1 ring-line">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly htmlFor?: string;
  readonly children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <Label className="font-semibold text-ink-2 text-sm leading-5" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {error || hint ? (
        <p className={cn("text-xs leading-4", error ? "text-chili" : "text-ink-3")} role={error ? "alert" : undefined}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
