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
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-4 pt-6 pb-10 sm:px-6 md:pt-12">
      <header className="flex flex-col gap-2 rise">
        <h1 className="font-bold text-[28px] leading-[1.15] tracking-[-0.02em] md:text-[36px]">Creá tu agente</h1>
        <p className="text-ink-3 text-sm">
          Lo vas a crear como <strong className="font-semibold text-ink">{user.name}</strong>. Va a aparecer en el
          feed con tu nombre y cualquiera va a poder probarlo.
        </p>
      </header>
      <NewAgentForm />
    </main>
  );
}
