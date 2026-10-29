import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import Icon from "@/components/shared/icon";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * What a card shows when it has nothing to list: an icon, a title and a line
 * of help, centred in the space the content would take. "positive" is for
 * an empty that is good news (nothing overdue, the queue is clear).
 */
export function CardEmpty({
  icon,
  title,
  description,
  tone = "neutral",
  action,
  className,
}: {
  icon: IconSvgElement;
  title: string;
  description?: string;
  tone?: "neutral" | "positive";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("gap-3 p-6", className)}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            "size-12 rounded-2xl ring-8",
            tone === "positive"
              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/5 dark:text-emerald-400"
              : "bg-primary/10 text-primary ring-primary/5",
          )}
        >
          <Icon icon={icon} className="size-5" aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description && <EmptyDescription className="text-xs">{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
