import Icon from "@/components/shared/icon";
import type { IconSvgElement } from "@hugeicons/react";
import CardLayout from "@/components/layouts/card-layout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * A detail-page section, built on the same CardLayout shell the list pages use
 * so both surfaces read alike: a muted rounded frame holding an inset panel.
 */
export function DetailCard({
  title,
  description,
  action,
  children,
  className,
  titleClassName,
  bodyClassName,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  /** Classes for the inset panel, e.g. to lay its content out as a column. */
  bodyClassName?: string;
  compact?: boolean;
}) {
  return (
    <CardLayout
      title={title}
      description={description}
      cardAction={action}
      titleClassName={titleClassName}
      // Side-by-side cards share a row height, so the panel stretches to fill
      // its frame rather than leaving the muted shell showing underneath.
      className={cn("flex flex-col gap-0", className)}
    >
      <div
        className={cn(
          "h-full space-y-4 rounded-xl border bg-background p-4 shadow-none",
          compact && "p-0",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </CardLayout>
  );
}

export function LabeledItem({
  label,
  value,
  icon: glyph,
}: {
  label: string;
  value: ReactNode;
  icon?: IconSvgElement;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-normal tracking-widest uppercase text-muted-foreground block">
        {label}
      </span>
      <div className="flex items-center gap-2 text-sm">
        {glyph && (
          <Icon icon={glyph} className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-foreground">{value || "N/A"}</span>
      </div>
    </div>
  );
}

const STATUS_PILLS: Record<string, string> = {
  // workspace statuses
  active:
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
  suspended:
    "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
  // user statuses
  deactivated:
    "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400",
  // invoice statuses ("overdue" is a sent invoice past its due date)
  draft:
    "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-300",
  sent: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400",
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
  overdue:
    "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400",
  void: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400",
  // fallback
  pending:
    "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
};

export function StatusPill({
  status,
  prefix,
}: {
  status: string;
  prefix?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-1 text-xs font-medium capitalize tracking-wide rounded-full border",
        STATUS_PILLS[status] ?? STATUS_PILLS.pending,
      )}
    >
      {prefix ? `${prefix} ` : ""}
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
