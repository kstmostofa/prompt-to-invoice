"use client";
import { DataTableColumnHeader } from "@/components/datatable/datatable-column-header";
import { StatusPill } from "@/components/shared/detail-card";
import { formatDate, formatMoney } from "@/lib/helper";
import { Invoice } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "number",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
    cell: ({ row }) => (
      <Link href={`/invoices/${row.original.id}`} className="font-mono font-medium hover:underline">
        {row.original.number}
      </Link>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: "client",
    header: "Client",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.to.company || row.original.to.name}</div>
        {row.original.to.company && <div className="text-xs text-muted-foreground">{row.original.to.name}</div>}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "issue_date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Issued" />,
    cell: ({ row }) => <div className="text-muted-foreground">{formatDate(row.original.issue_date, { month: "short" })}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    cell: ({ row }) => (
      <div className={row.original.display_status === "overdue" ? "font-medium text-rose-500" : "text-muted-foreground"}>
        {formatDate(row.original.due_date, { month: "short" })}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "total",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) => <div className="font-medium tabular-nums">{formatMoney(row.original.total, row.original.currency)}</div>,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "display_status",
    header: "Status",
    cell: ({ row }) => <StatusPill status={row.original.display_status} />,
    enableSorting: false,
    enableHiding: true,
  },
];
