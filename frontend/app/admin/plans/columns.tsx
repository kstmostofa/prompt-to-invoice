"use client";
import DatatableBooleanCell from "@/components/datatable/datatable-boolean-cell";
import { DataTableColumnHeader } from "@/components/datatable/datatable-column-header";
import { formatMoney } from "@/lib/helper";
import { Plan } from "@/types/api";
import { ColumnDef } from "@tanstack/react-table";
import PlanAction from "./action";

export const columns: ColumnDef<Plan>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("slug")}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "monthly_price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Monthly" />,
    cell: ({ row }) => (
      <div className="tabular-nums">
        {row.original.monthly_price === null
          ? "Custom"
          : Number(row.original.monthly_price) === 0
            ? "Free"
            : formatMoney(row.original.monthly_price, row.original.currency)}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "monthly_invoice_limit",
    header: "Invoices / month",
    cell: ({ row }) => <div className="tabular-nums">{row.original.monthly_invoice_limit ?? "Unlimited"}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "seat_limit",
    header: "Seats",
    cell: ({ row }) => <div className="tabular-nums">{row.original.seat_limit ?? "Unlimited"}</div>,
    enableSorting: false,
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
    accessorKey: "sort_order",
    header: "Order",
    cell: ({ row }) => <div className="tabular-nums">{row.original.sort_order}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "is_active",
    header: "Active",
    cell: ({ row }) => <DatatableBooleanCell value={row.original.is_active} />,
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <PlanAction plan={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 100,
  },
];
