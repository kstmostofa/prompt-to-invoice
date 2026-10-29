"use client";
import Datatable from "@/components/datatable/datatable";
import { DatatableSelectFilter } from "@/components/datatable/datatable-select-filter";
import { useDatatable } from "@/hooks/use-datatable";
import { useDatatableFilters } from "@/hooks/use-datatable-filters";
import { useInitialQueryParams } from "@/hooks/use-initial-query-params";
import { User } from "@/types/api";
import { PaginatedData } from "@/types/global";
import { columns } from "./columns";

export default function UserTable({ data }: { data: PaginatedData<User> }) {
  const initialFilters = useInitialQueryParams();

  const { filters, onSortChange, onPaginationChange, onSearchChange, onResetFilters, onFilterChange, isFiltered } =
    useDatatableFilters(initialFilters);

  const table = useDatatable<User>({
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
      searchPlaceholder="Search name or email..."
      extraFilters={
        <>
          <DatatableSelectFilter
            title="Type"
            options={[
              { label: "Customers", value: "customer" },
              { label: "Staff", value: "admin" },
            ]}
            value={(filters.type as string) || null}
            onValueChange={(value) => onFilterChange("type", value)}
          />
          <DatatableSelectFilter
            title="Status"
            options={[
              { label: "Active", value: "active" },
              { label: "Deactivated", value: "inactive" },
            ]}
            value={(filters.status as string) || null}
            onValueChange={(value) => onFilterChange("status", value)}
          />
        </>
      }
    />
  );
}
