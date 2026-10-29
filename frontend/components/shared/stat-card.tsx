import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";

/**
 * A metric tile: the label and the figure in the inset panel, and what the
 * figure means (a change, a comparison, a note) on the frame beneath it,
 * with a link on the left when the tile leads somewhere. Same frame and
 * panel as every other card, so a row of these reads as part of the portal.
 *
 * The panel grows to fill the frame, which keeps a row of tiles level when
 * one footer wraps to two lines and the others do not. The admin app has the
 * same component; keep the two in step.
 */
export function StatCard({
  title,
  value,
  description,
  href,
  linkLabel = "View",
  className,
}: {
  title: string;
  value: ReactNode;
  description?: ReactNode;
  // Where the arrow goes: the page behind the figure.
  href?: string;
  // What the link says, next to its arrow: where it goes, in a word or two.
  linkLabel?: string;
  className?: string;
}) {
  const hasFooter = Boolean(description || href);

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-2xl bg-sidebar p-1 shadow-sm ring-1 ring-sidebar-border",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-2 rounded-xl border bg-background p-4">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{title}</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>

      {hasFooter && (
        <div className="flex min-h-9 items-center justify-between gap-3 px-2.5 py-1.5 text-xs text-muted-foreground">
          {href && (
            <Link
              href={href}
              className="group/link -ms-1 inline-flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              {linkLabel}
              <Icon icon={ArrowRight02Icon} className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          )}
          {description && (
            <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5 leading-snug", href && "justify-end text-right")}>
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** A StatCard's shape while its figure loads. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col rounded-2xl bg-sidebar p-1 shadow-sm ring-1 ring-sidebar-border", className)}>
      <div className="flex flex-1 flex-col gap-3 rounded-xl border bg-background p-4">
        <span className="h-3 w-20 animate-pulse rounded bg-muted" />
        <span className="h-8 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex min-h-9 items-center justify-between px-2.5 py-1.5">
        <span className="h-3 w-16 animate-pulse rounded bg-muted" />
        <span className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
