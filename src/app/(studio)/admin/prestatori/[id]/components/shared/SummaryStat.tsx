import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/lib/adminProviderDetail";

export function SummaryStat({
  icon: Icon,
  label,
  value,
  detail,
  variant = "outline",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  variant?: BadgeVariant;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Badge variant={variant}>{label}</Badge>
      </div>
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
