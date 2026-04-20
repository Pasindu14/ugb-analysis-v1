'use client'

import { useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ExportableData } from '@/components/data-table/utils/export-utils'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useImportDialog } from '../../store'
import { useSalesDataTable } from '../../hooks/sales.hooks'
import { getSalesColumns } from './sales-columns'
import { SalesFilters } from './sales-filters'

export function SalesTable() {
  const { open: openImport } = useImportDialog()

  const getColumns = useCallback(
    () => getSalesColumns() as ColumnDef<ExportableData>[],
    []
  )

  return (
    <DataTable
      config={{
        enableRowSelection:   false,
        enableSearch:         false,
        enableDateFilter:     false,
        enableExport:         false,
        enableColumnResizing: false,
        enableUrlState:       false,
      }}
      getColumns={getColumns}
      fetchDataFn={useSalesDataTable}
      exportConfig={{
        entityName: 'sales',
        columnMapping: {
          reportDate:      'Period',
          areaName:        'Area',
          supervisorName:  'Supervisor',
          distributorName: 'Distributor',
          repName:         'Rep',
          rootName:        'Route',
          outletType:      'Outlet Type',
          customerCode:    'Customer Code',
          customerName:    'Customer',
          grossSaleAmount: 'Gross Sale',
          netSaleAmount:   'Net Sale',
        },
        columnWidths: [
          { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 25 },
          { wch: 20 }, { wch: 16 }, { wch: 30 }, { wch: 12 },
          { wch: 28 }, { wch: 14 }, { wch: 12 },
        ],
        headers: [
          'Period', 'Area', 'Supervisor', 'Distributor',
          'Rep', 'Route', 'Outlet Type', 'Customer Code',
          'Customer', 'Gross Sale', 'Net Sale',
        ],
      }}
      idField="id"
      renderToolbarContent={() => (
        <Button onClick={openImport} className="gap-2">
          <Upload className="h-4 w-4" />
          Import Excel
        </Button>
      )}
      renderCustomFilters={(filters, setFilters) => (
        <SalesFilters filters={filters} setFilters={setFilters} />
      )}
    />
  )
}
