import Link from "next/link";
import { MangoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <MangoMark size={56} />
      <h1 className="font-bold text-[28px] leading-[1.15] tracking-[-0.02em]">No encontramos eso</h1>
      <p className="text-ink-2">Ese agente o creador no existe, o ya no es público.</p>
      <Button asChild size="sm" variant="secondary">
        <Link href="/agents">Volver a los agentes</Link>
      </Button>
    </main>
  );
}
