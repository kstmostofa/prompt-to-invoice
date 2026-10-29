"use client";
import Icon from "@/components/shared/icon";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "@hugeicons/core-free-icons";
import { PAGE_SIZE_OPTIONS } from "@/components/datatable/datatable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type Table } from "@tanstack/react-table";

interface DatatablePaginationProps<TData> {
  table: Table<TData>;
  from: number | null;
  to: number | null;
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  onPaginationChange: (page: number, pageSize: number) => void;
}

export function DatatablePagination<TData>({
  table,
  from,
  to,
  total,
  currentPage,
  lastPage,
  perPage,
  onPaginationChange,
}: DatatablePaginationProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center gap-4 px-4",
        "sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      {/* LEFT (becomes bottom on mobile) */}
      <div className="flex-1 text-sm text-muted-foreground text-center sm:text-left">
        <div className={cn(selectedRows > 0 ? "" : "invisible")}>
          {selectedRows} of {total} row(s) selected.
        </div>
      </div>

      {/* CENTER */}
      <div className="text-sm text-muted-foreground text-center shrink-0">
        Showing {from ?? 0} to {to ?? 0} of {total} entries
      </div>

      {/* RIGHT (becomes top on mobile) */}
      <div className="flex flex-1 justify-center sm:justify-end items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
        {/* Rows per page */}
        <div className="flex items-center space-x-2">
          <p className="whitespace-nowrap font-medium text-sm">Rows per page</p>
          <Select
            value={`${perPage}`}
            onValueChange={(value) => {
              onPaginationChange(1, Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-18">
              <SelectValue placeholder={`${perPage}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <div className="flex items-center justify-center font-medium text-sm whitespace-nowrap">
          Page {currentPage} of {lastPage}
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPaginationChange(1, perPage)}
            disabled={currentPage === 1}
          >
            <Icon icon={ChevronsLeftIcon} />
          </Button>

          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPaginationChange(Math.max(1, currentPage - 1), perPage)}
            disabled={currentPage === 1}
          >
            <Icon icon={ChevronLeftIcon} />
          </Button>

          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPaginationChange(Math.min(lastPage, currentPage + 1), perPage)}
            disabled={currentPage === lastPage}
          >
            <Icon icon={ChevronRightIcon} />
          </Button>

          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPaginationChange(lastPage, perPage)}
            disabled={currentPage === lastPage}
          >
            <Icon icon={ChevronsRightIcon} />
          </Button>
        </div>
      </div>
    </div>
  );
}
