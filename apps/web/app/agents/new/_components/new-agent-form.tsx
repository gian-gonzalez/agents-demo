"use client";

import { useActionState } from "react";
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
    <form action={action} className="flex flex-col gap-8">
      <Field error={errors.emoji} label="Ícono">
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {EMOJI_PRESETS.map((emoji) => (
            <label
              className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-xl transition-colors hover:border-primary/50 has-checked:border-primary has-checked:bg-primary/10"
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

      <Field error={errors.description} hint="Máx. 140 caracteres. Es lo que se ve en la tarjeta." htmlFor="description" label="Descripción">
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

      <Field error={errors.instructions} hint="Hablale como a una persona. Esto es lo que el agente va a seguir." htmlFor="instructions" label="Instrucciones">
        <Textarea
          aria-invalid={Boolean(errors.instructions)}
          className="min-h-32 font-mono text-sm"
          defaultValue={str("instructions")}
          id="instructions"
          maxLength={4000}
          name="instructions"
          placeholder={INSTRUCTIONS_PLACEHOLDER}
          required
        />
      </Field>

      <Field error={errors.permissions} hint="Capacidades de belo que el agente puede usar. Todo lo que mueve dinero requiere tu aprobación igual." label="Permisos belo">
        <ul className="grid gap-2 sm:grid-cols-2">
          {BELO_PERMISSIONS.map((permission) => (
            <li key={permission}>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 text-sm transition-colors hover:border-primary/40 has-checked:border-primary/60 has-checked:bg-primary/5">
                <input
                  className="mt-0.5 size-4 accent-primary"
                  defaultChecked={selectedPermissions.includes(permission)}
                  name="permissions"
                  type="checkbox"
                  value={permission}
                />
                <span className="min-w-0">
                  <span className="block font-mono text-xs">{permission}</span>
                  <span className="block text-muted-foreground text-xs">{BELO_PERMISSION_LABELS[permission]}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Field>

      <div className="grid gap-8 sm:grid-cols-2">
        <Field error={errors.cardLimitUsd} hint="Por operación, en dólares." htmlFor="cardLimitUsd" label="Límite de tarjeta (US$)">
          <Input
            aria-invalid={Boolean(errors.cardLimitUsd)}
            className="font-mono"
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

        <Field error={errors.visibility} label="Visibilidad">
          <div className="flex gap-2" role="radiogroup">
            {[
              { value: "public", label: "Público", hint: "Aparece en el feed" },
              { value: "unlisted", label: "Por enlace", hint: "Solo con el link" },
            ].map((option) => (
              <label
                className="flex flex-1 cursor-pointer flex-col gap-0.5 rounded-md border border-border bg-card p-3 text-sm transition-colors hover:border-primary/40 has-checked:border-primary/60 has-checked:bg-primary/5"
                key={option.value}
              >
                <input
                  className="sr-only"
                  defaultChecked={str("visibility", "public") === option.value}
                  name="visibility"
                  type="radio"
                  value={option.value}
                />
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground text-xs">{option.hint}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>

      {errors.form ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-border border-t pt-6">
        <p className="font-mono text-muted-foreground text-xs">
          <span className="text-primary">[READY]</span> capa de aprobación humana activa
        </p>
        <Button disabled={pending} size="lg" type="submit">
          {pending ? "Creando…" : "Crear agente"}
        </Button>
      </div>
    </form>
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
    <div className="flex flex-col gap-2">
      <Label className="font-mono text-muted-foreground text-xs uppercase tracking-widest" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}
