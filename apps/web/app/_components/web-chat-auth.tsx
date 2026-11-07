"use client";

import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignIn({
  callbackURL = "/",
  message = "Entrá para empezar",
  embedded = false,
}: {
  readonly callbackURL?: string;
  readonly message?: string;
  /** Inside another layout (the agent page) rather than a full page. */
  readonly embedded?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setPending(true);
    setError(undefined);
    try {
      const result = await authClient.signIn.social({ callbackURL, provider: "vercel" });
      if (!result.error) return;
      setPending(false);
      setError("No se pudo iniciar sesión. Probá de nuevo.");
    } catch {
      setPending(false);
      setError("No se pudo iniciar sesión. Probá de nuevo.");
    }
  }

  return (
    <main
      className={cn(
        "flex flex-1 items-center justify-center bg-background px-8 text-foreground",
        embedded ? "min-h-0" : "min-h-[calc(100dvh-3.5rem)]",
      )}
    >
      <div className="flex w-full max-w-[22rem] flex-col gap-5">
        <section aria-label="Iniciar sesión" className="flex flex-col gap-2">
          <h1 className="font-mono text-sm leading-6">
            <span className="font-medium">belo</span> <span className="text-muted-foreground">agentic</span>
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm leading-6">
            <span className="inline-flex items-center gap-2 font-mono text-primary text-xs uppercase tracking-widest">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              Ready
            </span>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span>{message}</span>
          </p>
          <Button className="mt-3 w-full gap-2 text-sm" disabled={pending} onClick={signIn}>
            <svg aria-hidden="true" className="size-3 fill-current" viewBox="0 0 24 20">
              <path d="M12 0 24 20H0L12 0Z" />
            </svg>
            <span className="leading-5">{pending ? "Redirigiendo…" : "Continuar con Vercel"}</span>
          </Button>
          <p className="font-mono text-[0.65rem] text-muted-foreground">
            Solo miembros del equipo de Vercel de esta demo pueden entrar.
          </p>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export function AccountControl({
  email,
  image,
  name,
}: {
  readonly email: string;
  readonly image?: string | null;
  readonly name: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const initials = getInitials(name, email);

  async function signOut() {
    setPending(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onError: () => setPending(false),
          onSuccess: () => window.location.assign("/"),
        },
      });
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="flex h-8 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Abrir menú de cuenta de ${name}`}
            className="relative size-7 cursor-pointer overflow-hidden rounded-full p-0"
            size="icon-sm"
            variant="ghost"
          >
            {image && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="size-full object-cover"
                onError={() => setImageFailed(true)}
                src={image}
              />
            ) : (
              <span aria-hidden="true" className="font-medium font-mono text-xs">
                {initials}
              </span>
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border border-white/25"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="min-w-0 px-2 py-1.5 text-sm">
            <span className="block truncate font-medium leading-5" title={name}>
              {name}
            </span>
            <span className="block truncate text-muted-foreground leading-5" title={email}>
              {email}
            </span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer justify-between"
            disabled={pending}
            onSelect={signOut}
          >
            {pending ? "Saliendo…" : "Salir"}
            <LogOutIcon aria-hidden="true" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? email[0] ?? "?").toUpperCase();
}
