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
        "relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-medium font-mono text-[0.65rem] text-secondary-foreground",
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
      <span className="pointer-events-none absolute inset-0 rounded-full border border-white/15" />
    </span>
  );
}
