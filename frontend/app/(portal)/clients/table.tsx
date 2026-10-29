"use client";
import Datatable from "@/components/datatable/datatable";
import { DatatableSelectFilter } from "@/components/datatable/datatable-select-filter";
import { useDatatable } from "@/hooks/use-datatable";
import { useDatatableFilters } from "@/hooks/use-datatable-filters";
import { useInitialQueryParams } from "@/hooks/use-initial-query-params";
import { Client } from "@/types/api";
import { PaginatedData } from "@/types/global";
import { columns } from "./columns";

const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
];

export default function ClientTable({ data }: { data: PaginatedData<Client> }) {
  const initialFilters = useInitialQueryParams();

  const { filters, onSortChange, onPaginationChange, onSearchChange, onResetFilters, onFilterChange, isFiltered } =
    useDatatableFilters(initialFilters);

  const table = useDatatable<Client>({
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
      searchPlaceholder="Search name, company or email..."
      extraFilters={
        <DatatableSelectFilter
          title="Currency"
          options={CURRENCY_OPTIONS}
          value={(filters.currency as string) || null}
          onValueChange={(value) => onFilterChange("currency", value)}
        />
      }
    />
  );
}
