import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimTag } from "@/components/brand";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { CASOS } from "@/content/casos.generated";
import { findShowcaseCase, SHOWCASE_CASES } from "@/lib/showcase";

type Params = Promise<{ readonly slug: string }>;

export function generateStaticParams() {
  return SHOWCASE_CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { readonly params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const showcase = findShowcaseCase(slug);
  return { title: showcase ? `Caso ${showcase.number}: ${showcase.title}` : "Caso de ejemplo" };
}

/** Una conversación guardada con un agente de ejemplo, tal cual la respondió el modelo. */
export default async function CasoPage({ params }: { readonly params: Params }) {
  const { slug } = await params;
  const showcase = findShowcaseCase(slug);
  const markdown = CASOS[slug];
  if (!showcase || !markdown) notFound();

  // El título y el resumen ya están en la cabecera de la página; el markdown arranca en el agente.
  const body = markdown.replace(/^# [^\n]*\n\n[^\n]*\n\n/u, "");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 md:pt-10">
      <Link className="inline-flex items-center gap-1.5 text-ink-3 text-sm hover:text-ink" href="/">
        <ArrowLeftIcon className="size-4" strokeWidth={2.2} />
        Volver
      </Link>

      <header className="flex flex-col gap-3 rise">
        <div className="flex items-center gap-2 text-ink-3 text-xs">
          <span className="font-semibold uppercase tracking-[0.06em]">Caso de ejemplo {showcase.number}</span>
          <SimTag />
        </div>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sheet text-2xl ring-1 ring-line md:size-14 md:text-3xl"
          >
            {showcase.emoji}
          </span>
          <h1 className="font-bold text-[28px] leading-[1.15] tracking-[-0.02em] md:text-[36px]">{showcase.title}</h1>
        </div>
        <p className="text-ink-2 md:text-lg">{showcase.blurb}</p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button asChild>
            <Link href={`/agents/${encodeURIComponent(showcase.agentId)}`}>
              Probar este agente en vivo
              <ArrowRightIcon className="size-4" strokeWidth={2.2} />
            </Link>
          </Button>
        </div>
      </header>

      <article className="rounded-2xl bg-sheet px-5 py-6 ring-1 ring-line sm:px-8">
        <MessageResponse
          className="[&_h2]:mt-8 [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:text-base [&_h3]:text-ink-2 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-2 [&_hr]:my-6 [&_hr]:border-line [&_sub]:text-ink-3"
          isAnimating={false}
        >
          {body}
        </MessageResponse>
      </article>
    </main>
  );
}
