"use client";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

interface UseDatatableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageCount: number;
  currentPage: number;
  perPage: number;
  onSortChange: (id: string, desc: boolean) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useDatatable<TData>({
  data,
  columns,
  pageCount,
  currentPage,
  perPage,
  sortBy,
  sortOrder,
  onSortChange,
}: UseDatatableOptions<TData>): Table<TData> {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>(
    sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []
  );

  useEffect(() => {
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      onSortChange(id, desc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  return useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });
}
