"use client";
import { useQueryParams } from "@/hooks/use-query-params";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export interface Filters {
  search?: string;
  page?: string;
  per_page?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  includeTrash?: boolean;
  [key: string]: string | string[] | boolean | undefined;
}

export function useDatatableFilters(initialFilters?: Filters) {
  const queryParams = useQueryParams();
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({
    ...queryParams,
    ...initialFilters,
  });

  const updateFilters = (newFilters: Filters) => {
    setFilters(newFilters);

    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(`${key}[]`, v));
      } else if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });
    router.push(window.location.pathname + "?" + params.toString());
  };

  const onPaginationChange = (page: number, pageSize: number) => {
    updateFilters({
      ...filters,
      page: page.toString(),
      per_page: pageSize.toString(),
    });
  };

  const onSearchChange = (value: string) => {
    updateFilters({
      ...filters,
      search: value,
      page: "1",
    });
  };

  const onResetFilters = () => {
    setFilters({});
    router.push(window.location.pathname);
  };

  const onFilterChange = (key: string, value: string | string[]) => {
    updateFilters({
      ...filters,
      [key]: value,
      page: "1",
    });
  };

  const onIncludeTrashChange = (includeTrash: boolean) => {
    updateFilters({
      ...filters,
      includeTrash: includeTrash,
      page: "1",
    });
  };

  const onRangeChange = (newFilters: Filters) => {
    updateFilters({
      ...filters,
      ...newFilters,
      page: "1",
    });
  };

  const onSortChange = (id: string, desc: boolean) => {
    updateFilters({
      ...filters,
      sort_by: id,
      sort_order: desc ? "desc" : "asc",
      page: "1",
    });
  };

  const isFiltered = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (["page", "per_page"].includes(key)) {
        return false;
      }
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === "string" && value.trim() === "") {
        return false;
      }
      return !(Array.isArray(value) && value.length === 0);
    });
  }, [filters]);

  return {
    filters,
    setFilters,
    onPaginationChange,
    onSearchChange,
    onResetFilters,
    onFilterChange,
    onRangeChange,
    onSortChange,
    isFiltered,
    onIncludeTrashChange,
  };
}
