"use client";

import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { MangoMark } from "@/components/brand";
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
        "flex flex-1 items-center justify-center bg-paper px-4 text-ink",
        embedded ? "min-h-0 py-8" : "min-h-[calc(100dvh-3.5rem)]",
      )}
    >
      <section
        aria-label="Iniciar sesión"
        className="flex w-full flex-col gap-5 rounded-2xl bg-sheet p-6 ring-1 ring-line rise"
      >
        <div className="flex flex-col items-start gap-3">
          <MangoMark size={40} />
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-[20px] leading-6 tracking-[-0.01em]">{message}</h1>
            <p className="text-ink-3 text-sm leading-5">Tu plata, tus reglas. Entrás con tu cuenta de Vercel.</p>
          </div>
        </div>
        {/* Única acción mango de la pantalla */}
        <Button className="w-full" disabled={pending} onClick={signIn} size="lg">
          <svg aria-hidden="true" className="size-3.5 fill-current" viewBox="0 0 24 20">
            <path d="M12 0 24 20H0L12 0Z" />
          </svg>
          <span>{pending ? "Redirigiendo…" : "Continuar con Vercel"}</span>
        </Button>
        {error ? (
          <p className="text-chili text-xs" role="alert">
            {error}
          </p>
        ) : null}
      </section>
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
    <div className="flex h-9 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Abrir menú de cuenta de ${name}`}
            className="relative size-9 cursor-pointer overflow-hidden rounded-full bg-ink/[0.05] p-0 hover:bg-ink/[0.08]"
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
              <span aria-hidden="true" className="font-semibold text-ink-2 text-xs">
                {initials}
              </span>
            )}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-line ring-inset" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="min-w-0 px-2.5 py-2 text-sm">
            <span className="block truncate font-semibold text-ink leading-5" title={name}>
              {name}
            </span>
            <span className="block truncate text-ink-3 leading-5" title={email}>
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
            <LogOutIcon aria-hidden="true" strokeWidth={2.2} />
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
