"use client";
import Icon from "@/components/shared/icon";
import {
  CheckIcon,
  Search01Icon,
  Settings05Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type Table } from "@tanstack/react-table";
import { useState } from "react";

interface DatatableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DatatableViewOptions<TData>({
  table,
}: DatatableViewOptionsProps<TData>) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Toggle columns" variant="outline" size="icon" />
        }
      >
        <Icon icon={Settings05Icon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            placeholder="Search"
            onKeyDown={(e) => e.stopPropagation()}
          />
          <Icon
            icon={Search01Icon}
            className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
          />
        </div>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            if (
              searchQuery &&
              !column.id.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              return null;
            }

            const visible = column.getIsVisible();

            return (
              // A real menu checkbox item so the whole row (label included)
              // toggles — a nested interactive <Checkbox> swallowed clicks
              // and its colors fought the menu's focus styles (flicker).
              // The visual box mirrors DatatableMultiSelectFilter: fully
              // opaque colors, so the row's hover/focus background cannot
              // show through and shift its appearance. The kit's right-side
              // indicator is hidden in favour of it.
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visible}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                closeOnClick={false}
                // focus:**:text-current replaces the kit's
                // focus:**:text-accent-foreground (tailwind-merge drops it),
                // which recolored every descendant — the check icon included —
                // whenever the row was hovered/focused.
                className="pr-3 [&_[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden focus:**:text-current"
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    visible ? "bg-primary" : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  {/* important: the menu's focus:**:text-accent-foreground
                      rule recolors descendants on hover/focus */}
                  <Icon
                    icon={CheckIcon}
                    className="size-3.5 text-primary-foreground!"
                  />
                </div>
                <span className="capitalize">
                  {column.id.replace(/_/g, " ")}
                </span>
              </DropdownMenuCheckboxItem>
            );
          })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-center"
          onClick={() => {
            table.resetColumnVisibility();
            setSearchQuery("");
          }}
        >
          Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
