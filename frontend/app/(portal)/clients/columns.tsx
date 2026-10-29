"use client";
import { DataTableColumnHeader } from "@/components/datatable/datatable-column-header";
import { Flag } from "@/components/shared/flag";
import { formatDate } from "@/lib/helper";
import { countryName } from "@/lib/countries";
import { Client } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import ClientAction from "./action";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => (
      <Link href={`/clients/${row.original.id}`} className="block hover:underline">
        <div className="font-medium">{row.original.name}</div>
        {row.original.company && <div className="text-xs text-muted-foreground">{row.original.company}</div>}
      </Link>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.email ?? "—"}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "country",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
    cell: ({ row }) =>
      row.original.country ? (
        <div className="flex items-center gap-2">
          <Flag code={row.original.country} />
          {countryName(row.original.country)}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "currency",
    header: "Currency",
    cell: ({ row }) => <div className="tabular-nums">{row.original.currency ?? "Default"}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => <div className="text-muted-foreground">{formatDate(row.original.created_at, { month: "short" })}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <ClientAction client={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 120,
  },
];
