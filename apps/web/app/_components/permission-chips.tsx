import { Chip } from "@/components/brand";
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
    return <span className={cn("text-ink-3 text-xs", className)}>Sin permisos</span>;
  }
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {permissions.map((permission) => (
        <li key={permission}>
          <Chip
            className={cn(compact && "font-normal text-ink-3")}
            title={isBeloPermission(permission) ? BELO_PERMISSION_LABELS[permission] : permission}
          >
            {compact || !isBeloPermission(permission) ? permission : BELO_PERMISSION_LABELS[permission]}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
