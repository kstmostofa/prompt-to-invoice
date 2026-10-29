"use client";
import Datatable from "@/components/datatable/datatable";
import { DatatableSelectFilter } from "@/components/datatable/datatable-select-filter";
import { useDatatable } from "@/hooks/use-datatable";
import { useDatatableFilters } from "@/hooks/use-datatable-filters";
import { useInitialQueryParams } from "@/hooks/use-initial-query-params";
import { Invoice } from "@/types/api";
import { PaginatedData } from "@/types/global";
import { columns } from "./columns";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Overdue", value: "overdue" },
  { label: "Paid", value: "paid" },
  { label: "Void", value: "void" },
];

export default function InvoiceTable({ data }: { data: PaginatedData<Invoice> }) {
  const initialFilters = useInitialQueryParams();

  const { filters, onSortChange, onPaginationChange, onSearchChange, onResetFilters, onFilterChange, isFiltered } =
    useDatatableFilters(initialFilters);

  const table = useDatatable<Invoice>({
    data: data.data ?? [],
    columns,
    pageCount: data.meta?.last_page ?? 1,
    currentPage: data.meta?.current_page ?? 1,
    perPage: data.meta?.per_page ?? 10,
    onSortChange,
    sortBy: filters.sort_by,
    sortOrder: filters.sort_order,
  });

  return (
    <Datatable
      table={table}
      data={data}
      filters={filters}
      onPaginationChange={onPaginationChange}
      onSearchChange={onSearchChange}
      onResetFilters={onResetFilters}
      isFiltered={isFiltered}
      searchPlaceholder="Search number or client..."
      extraFilters={
        <DatatableSelectFilter
          title="Status"
          options={STATUS_OPTIONS}
          value={(filters.status as string) || null}
          onValueChange={(value) => onFilterChange("status", value)}
        />
      }
    />
  );
}
