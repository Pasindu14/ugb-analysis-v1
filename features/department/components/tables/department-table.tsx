'use client'

import { useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ExportableData } from '@/components/data-table/utils/export-utils'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  useCreateDialog,
  useEditDialog,
  useActivateDialog,
  useDeactivateDialog,
} from '../../store'
import { useDepartmentDataTable } from '../../hooks/department.hooks'
import { getDepartmentColumns } from './department-columns'

export function DepartmentTable() {
  const { open: openCreate }     = useCreateDialog()
  const { open: openEdit }       = useEditDialog()
  const { open: openActivate }   = useActivateDialog()
  const { open: openDeactivate } = useDeactivateDialog()

  const getColumns = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_handleRowDeselection: ((rowId: string) => void) | null | undefined) =>
      getDepartmentColumns({ openEdit, openActivate, openDeactivate }) as ColumnDef<ExportableData>[],
    [openEdit, openActivate, openDeactivate],
  )

  return (
    <DataTable
      config={{
        enableRowSelection:   false,
        enableSearch:         true,
        enableDateFilter:     false,
        enableExport:         false,
        enableColumnResizing: false,
        enableUrlState:       false,
        searchPlaceholder:    'Search departments...',
      }}
      getColumns={getColumns}
      fetchDataFn={useDepartmentDataTable}
      exportConfig={{
        entityName: 'departments',
        columnMapping: {
          name:      'Name',
          isActive:  'Status',
          createdAt: 'Created At',
        },
        columnWidths: [{ wch: 30 }, { wch: 12 }, { wch: 20 }],
        headers: ['Name', 'Status', 'Created At'],
      }}
      idField="id"
      renderToolbarContent={() => (
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      )}
    />
  )
}
