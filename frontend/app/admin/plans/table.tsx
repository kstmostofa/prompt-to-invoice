"use client";
import Datatable from "@/components/datatable/datatable";
import { useDatatable } from "@/hooks/use-datatable";
import { useDatatableFilters } from "@/hooks/use-datatable-filters";
import { useInitialQueryParams } from "@/hooks/use-initial-query-params";
import { PaginatedData } from "@/types/global";
import { Plan } from "@/types/api";
import { columns } from "./columns";

interface PlanTableProps {
  data: PaginatedData<Plan>;
}

export default function PlanTable({ data }: PlanTableProps) {
  const initialFilters = useInitialQueryParams();

  const { filters, onSortChange, onPaginationChange, onSearchChange, onResetFilters, isFiltered } =
    useDatatableFilters(initialFilters);

  const table = useDatatable<Plan>({
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
      searchPlaceholder="Search plans..."
    />
  );
}
