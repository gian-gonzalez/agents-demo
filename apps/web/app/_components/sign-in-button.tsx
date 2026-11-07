"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInButton({ callbackURL = "/" }: { readonly callbackURL?: string }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    try {
      const result = await authClient.signIn.social({ callbackURL, provider: "vercel" });
      if (result.error) setPending(false);
    } catch {
      setPending(false);
    }
  }

  return (
    <Button className="gap-2" disabled={pending} onClick={signIn} size="sm" type="button" variant="outline">
      <svg aria-hidden="true" className="size-3 fill-current" viewBox="0 0 24 20">
        <path d="M12 0 24 20H0L12 0Z" />
      </svg>
      {pending ? "Redirigiendo…" : "Entrar con Vercel"}
    </Button>
  );
}
