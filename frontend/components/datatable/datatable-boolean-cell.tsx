import Icon from "@/components/shared/icon";
import {
  CheckmarkCircle02Icon,
  MinusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A yes/no column: a pill with a mark and the word, rather than a bare glyph.
 *
 * False is muted, not red. These columns hold ordinary facts — a product that
 * is not featured, an attribute that is not filterable — and a red cross reads
 * as something being wrong. Only the true state is coloured, so a glance down
 * the column picks out what is on.
 */
export default function DatatableBooleanCell({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  className,
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        value
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-transparent bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon
        icon={value ? CheckmarkCircle02Icon : MinusSignCircleIcon}
        className="size-3.5"
        aria-hidden
      />
      {value ? trueLabel : falseLabel}
    </Badge>
  );
}
