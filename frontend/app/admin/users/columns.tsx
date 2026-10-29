"use client";
import { DataTableColumnHeader } from "@/components/datatable/datatable-column-header";
import { StatusPill } from "@/components/shared/detail-card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/helper";
import { User } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import { UserAction } from "./action";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.is_admin && <Badge variant="secondary">Staff</Badge>}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "workspaces_count",
    header: "Workspaces",
    cell: ({ row }) => <div className="tabular-nums">{row.original.workspaces_count ?? 0}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => <StatusPill status={row.original.is_active ? "active" : "deactivated"} />,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "last_login_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last sign-in" />,
    cell: ({ row }) => <div className="text-muted-foreground">{formatDate(row.original.last_login_at, { month: "short" }) || "Never"}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => <div className="text-muted-foreground">{formatDate(row.original.created_at, { month: "short" })}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <UserAction user={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 120,
  },
];
