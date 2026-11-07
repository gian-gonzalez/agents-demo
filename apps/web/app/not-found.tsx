import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-20 font-mono sm:px-6">
      <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">$ belo agents open</p>
      <h1 className="text-2xl">[404] NOT_FOUND</h1>
      <p className="text-muted-foreground text-sm">Ese agente o creador no existe, o ya no es público.</p>
      <Button asChild size="sm" variant="outline">
        <Link href="/agents">Volver a los agentes →</Link>
      </Button>
    </main>
  );
}
