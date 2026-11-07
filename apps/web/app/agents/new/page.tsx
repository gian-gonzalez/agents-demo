import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/current-user";
import { SignIn } from "../../_components/web-chat-auth";
import { NewAgentForm } from "./_components/new-agent-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Crear agente" };

export default async function NewAgentPage() {
  const user = await getCurrentUser();
  if (!user) return <SignIn callbackURL="/agents/new" message="Entrá con Vercel para crear tu agente" />;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">Nuevo agente</p>
        <h1 className="font-medium text-3xl tracking-tight">Creá tu agente belo</h1>
        <p className="text-muted-foreground text-sm">
          Lo vas a crear como <strong className="text-foreground">{user.name}</strong>. Va a aparecer en el
          feed con tu nombre y cualquiera va a poder probarlo.
        </p>
      </header>
      <NewAgentForm />
    </main>
  );
}
