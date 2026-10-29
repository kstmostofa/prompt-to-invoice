"use client";

import type { ReactNode } from "react";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { FilterRemoveIcon, InboxIcon, SearchRemoveIcon } from "@hugeicons/core-free-icons";

export interface DataTableEmptyState {
  title: string;
  description?: string;
  // A way forward, e.g. "Add product".
  action?: ReactNode;
}

/**
 * What a table shows with no rows. Two different situations, said
 * differently: a search or filter that matched nothing (say what was searched
 * and offer to clear it), and a table with nothing in it yet (say so calmly,
 * in the table's own words when it gives them).
 */
export default function DataTableEmpty({
  filtered,
  search,
  onReset,
  emptyState,
}: {
  filtered: boolean;
  search?: string;
  onReset: () => void;
  emptyState?: DataTableEmptyState;
}) {
  const term = search?.trim();

  const content = filtered
    ? {
        icon: term ? SearchRemoveIcon : FilterRemoveIcon,
        title: term ? `No results for "${term}"` : "No matches",
        description: term
          ? "Check the spelling, try fewer words, or clear the search and filters."
          : "Nothing matches these filters. Loosen or clear them to see more.",
        action: (
          <Button variant="outline" size="sm" onClick={onReset}>
            <Icon icon={FilterRemoveIcon} className="size-4" />
            Clear {term ? "search and filters" : "filters"}
          </Button>
        ),
      }
    : {
        icon: InboxIcon,
        title: emptyState?.title ?? "Nothing here yet",
        description: emptyState?.description ?? "When there is something to show, it appears here.",
        action: emptyState?.action,
      };

  return (
    <Empty className="gap-3 px-6 py-14">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            "size-12 rounded-2xl ring-8",
            filtered ? "bg-muted text-muted-foreground ring-muted/40" : "bg-primary/10 text-primary ring-primary/5"
          )}
        >
          <Icon icon={content.icon} className="size-5" aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-base">{content.title}</EmptyTitle>
        {content.description && (
          <EmptyDescription className="max-w-sm text-sm">{content.description}</EmptyDescription>
        )}
      </EmptyHeader>
      {content.action && <EmptyContent>{content.action}</EmptyContent>}
    </Empty>
  );
}
