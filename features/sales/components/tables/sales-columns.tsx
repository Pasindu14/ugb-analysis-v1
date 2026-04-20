'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import type { AreaCustomerSale } from '@/db/schema'

export function getSalesColumns(): ColumnDef<AreaCustomerSale>[] {
  return [
    {
      accessorKey: 'reportDate',
      size: 110,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      cell: ({ row }) => <span className="text-sm">{row.getValue('reportDate')}</span>,
    },
    {
      accessorKey: 'areaName',
      size: 150,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('areaName')}</span>,
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
      cell: ({ row }) => <span className="text-sm">{row.getValue('rootName')}</span>,
    },
    {
      accessorKey: 'outletType',
      size: 200,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Outlet Type" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue('outletType')}</span>,
    },
    {
      accessorKey: 'customerCode',
      size: 100,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cust. Code" />,
      cell: ({ row }) => <span className="text-sm font-mono">{row.getValue('customerCode')}</span>,
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
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {Number(row.getValue('grossSaleAmount')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'netSaleAmount',
      size: 120,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Net Sale" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {Number(row.getValue('netSaleAmount')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ]
}
