import { initials } from "@/lib/time";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  image,
  className,
}: {
  readonly name: string;
  readonly image?: string | null;
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink/[0.05] font-semibold text-[11px] text-ink-2 uppercase tracking-[0.04em]",
        className,
      )}
      aria-hidden="true"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="size-full object-cover" src={image} />
      ) : (
        initials(name)
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-ink/10 ring-inset" />
    </span>
  );
}
