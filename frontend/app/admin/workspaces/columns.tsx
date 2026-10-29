"use client";
import { DataTableColumnHeader } from "@/components/datatable/datatable-column-header";
import { StatusPill } from "@/components/shared/detail-card";
import { formatDate } from "@/lib/helper";
import { Workspace } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export const columns: ColumnDef<Workspace>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Workspace" />,
    cell: ({ row }) => (
      <Link href={`/admin/workspaces/${row.original.id}`} className="block hover:underline">
        <div className="font-medium">{row.original.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.slug}</div>
      </Link>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) => (
      <div>
        <div>{row.original.owner?.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.owner?.email}</div>
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "plan",
    header: "Plan",
    cell: ({ row }) => <div>{row.original.plan?.name ?? "—"}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "members_count",
    header: "Members",
    cell: ({ row }) => <div className="tabular-nums">{row.original.members_count ?? 0}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "clients_count",
    header: "Clients",
    cell: ({ row }) => <div className="tabular-nums">{row.original.clients_count ?? 0}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusPill status={row.original.status} />,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => <div className="text-muted-foreground">{formatDate(row.original.created_at, { month: "short" })}</div>,
    enableSorting: true,
    enableHiding: true,
  },
];
