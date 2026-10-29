"use client";
import Icon from "@/components/shared/icon";
import {
  Cancel01Icon,
  ViewIcon,
  EyeOffIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import DataTableEmpty, { type DataTableEmptyState } from "@/components/datatable/datatable-empty";
import { DatatablePagination } from "@/components/datatable/datatable-pagination";
import { DatatableViewOptions } from "@/components/datatable/datatable-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Filters } from "@/hooks/use-datatable-filters";
import { cn } from "@/lib/utils";
import { PaginatedData } from "@/types/global";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { ReactNode } from "react";
import DatatableBlockFilters from "./datatable-block-filters";

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

interface DatatableProps<TData> {
  table: TanstackTable<TData>;
  data: PaginatedData<TData>;
  searchPlaceholder?: string;
  extraFilters?: ReactNode;
  extraFiltersStyle?: "inline" | "block";
  filters: Filters;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  // The table's own words for "nothing here yet" (not for "no matches").
  emptyState?: DataTableEmptyState;
  onPaginationChange: (page: number, pageSize: number) => void;
  density?: "compact" | "standard" | "flexible";
  includeTrash?: boolean;
  onIncludeTrashChange?: (includeTrash: boolean) => void;
}

export default function Datatable<TData>({
  table,
  data,
  searchPlaceholder = "Search...",
  extraFilters,
  filters,
  onSearchChange,
  onResetFilters,
  isFiltered,
  emptyState,
  onPaginationChange,
  density = "flexible",
  includeTrash,
  onIncludeTrashChange,
  extraFiltersStyle = "inline",
}: DatatableProps<TData>) {
  return (
    <section>
      {extraFilters && extraFiltersStyle === "block" && (
        <DatatableBlockFilters>{extraFilters}</DatatableBlockFilters>
      )}
      <div className="flex flex-col space-y-4 rounded-xl border py-4 bg-background bg-clip-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4">
          <div className="flex w-full flex-col items-center gap-2 md:flex-row md:items-center md:flex-1 md:justify-start">
            <div className="relative w-full md:w-[250px]">
              <Input
                placeholder={searchPlaceholder}
                value={filters.search || ""}
                onChange={(event) => {
                  onSearchChange(event.target.value);
                }}
                className="pl-8 w-full"
              />
              <Icon
                icon={Search01Icon}
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
            </div>

            {/* Extra filters */}
            {extraFilters && extraFiltersStyle === "inline" && (
              <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:flex-wrap md:w-auto md:justify-start">
                {extraFilters}
              </div>
            )}

            {/* Reset */}
            {isFiltered && (
              <Button
                variant="outline"
                onClick={onResetFilters}
                className="border border-dashed px-3 w-full sm:w-auto"
              >
                <Icon icon={Cancel01Icon} className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto md:justify-end">
            {includeTrash && onIncludeTrashChange && (
              <Button
                variant="outline"
                onClick={() => onIncludeTrashChange(!filters.includeTrash)}
                className="w-full sm:w-auto"
              >
                {filters.includeTrash ? (
                  <Icon icon={ViewIcon} className="size-4" />
                ) : (
                  <Icon icon={EyeOffIcon} className="size-4" />
                )}
                {filters.includeTrash ? "Hide Deleted" : "Show Deleted"}
              </Button>
            )}

            <DatatableViewOptions table={table} />
          </div>
        </div>
        <div className="overflow-hidden border-y">
          <Table
            className={cn({
              "[&_td]:py-px [&_th]:py-px": density === "compact",
              "[&_td]:py-1 [&_th]:py-1": density === "standard",
              "[&_td]:py-2 [&_th]:py-1": density === "flexible",
            })}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="p-0"
                    style={{ paddingBlock: 0 }}
                  >
                    <DataTableEmpty
                      filtered={isFiltered || !!filters.search}
                      search={typeof filters.search === "string" ? filters.search : undefined}
                      onReset={onResetFilters}
                      emptyState={emptyState}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DatatablePagination
          table={table}
          from={data?.meta?.from ?? 0}
          to={data?.meta?.to ?? 0}
          total={data?.meta?.total ?? 0}
          currentPage={data?.meta?.current_page ?? 1}
          lastPage={data?.meta?.last_page ?? 1}
          perPage={data?.meta?.per_page ?? PAGE_SIZE_OPTIONS[0]}
          onPaginationChange={onPaginationChange}
        />
      </div>
    </section>
  );
}
