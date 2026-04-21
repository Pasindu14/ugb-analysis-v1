'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import type { AreaCustomerSale } from '@/db/schema'

function MoneyCell({ value }: { value: number }) {
  return (
    <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
      {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </span>
  )
}

function OutletBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {type}
    </span>
  )
}

export function getSalesColumns(): ColumnDef<AreaCustomerSale>[] {
  return [
    {
      accessorKey: 'reportDate',
      size: 110,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
          {row.getValue('reportDate')}
        </span>
      ),
    },
    {
      accessorKey: 'areaName',
      size: 150,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
      cell: ({ row }) => (
        <span className="text-sm font-semibold tracking-tight">{row.getValue('areaName')}</span>
      ),
    },
    {
      accessorKey: 'supervisorName',
      size: 160,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supervisor" />,
      cell: ({ row }) => <span className="text-sm">{row.getValue('supervisorName')}</span>,
    },
    {
      accessorKey: 'distributorName',
      size: 180,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Distributor" />,
      cell: ({ row }) => <span className="text-sm">{row.getValue('distributorName')}</span>,
    },
    {
      accessorKey: 'repName',
      size: 160,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rep" />,
      cell: ({ row }) => <span className="text-sm">{row.getValue('repName')}</span>,
    },
    {
      accessorKey: 'rootName',
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Route" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue('rootName')}</span>
      ),
    },
    {
      accessorKey: 'outletType',
      size: 210,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Outlet Type" />,
      cell: ({ row }) => <OutletBadge type={row.getValue('outletType')} />,
    },
    {
      accessorKey: 'customerCode',
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cust. Code" />,
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{row.getValue('customerCode')}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      size: 200,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => <span className="text-sm">{row.getValue('customerName')}</span>,
    },
    {
      accessorKey: 'grossSaleAmount',
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Gross Sale" />,
      cell: ({ row }) => <MoneyCell value={Number(row.getValue('grossSaleAmount'))} />,
    },
    {
      accessorKey: 'netSaleAmount',
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Net Sale" />,
      cell: ({ row }) => <MoneyCell value={Number(row.getValue('netSaleAmount'))} />,
    },
  ]
}
