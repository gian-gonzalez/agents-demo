import { BELO_PERMISSION_LABELS, isBeloPermission } from "@/lib/belo";
import { cn } from "@/lib/utils";

export function PermissionChips({
  permissions,
  className,
  compact = false,
}: {
  readonly permissions: readonly string[];
  readonly className?: string;
  readonly compact?: boolean;
}) {
  if (permissions.length === 0) {
    return <span className={cn("font-mono text-muted-foreground text-xs", className)}>sin permisos</span>;
  }
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {permissions.map((permission) => (
        <li
          className="rounded-sm border border-border bg-secondary/40 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground leading-4"
          key={permission}
          title={isBeloPermission(permission) ? BELO_PERMISSION_LABELS[permission] : permission}
        >
          {compact || !isBeloPermission(permission) ? permission : BELO_PERMISSION_LABELS[permission]}
        </li>
      ))}
    </ul>
  );
}
