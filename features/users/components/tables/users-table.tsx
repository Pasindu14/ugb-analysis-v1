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
  useChangePasswordDialog,
} from '../../store'
import { useUserDataTable } from '../../hooks/users.hooks'
import { getUserColumns } from './users-columns'

export function UserTable() {
  const { open: openCreate }      = useCreateDialog()
  const { open: openEdit }        = useEditDialog()
  const { open: openActivate }    = useActivateDialog()
  const { open: openDeactivate }  = useDeactivateDialog()
  const { open: openChangePassword } = useChangePasswordDialog()

  const getColumns = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_handleRowDeselection: ((rowId: string) => void) | null | undefined) =>
      getUserColumns({ openEdit, openActivate, openDeactivate, openChangePassword }) as ColumnDef<ExportableData>[],
    [openEdit, openActivate, openDeactivate, openChangePassword],
  )

  return (
    <DataTable
      config={{
        enableRowSelection:    false,
        enableSearch:          true,
        enableDateFilter:      false,
        enableExport:          false,
        enableColumnResizing:  false,
        enableUrlState:        false,
        searchPlaceholder:     'Search users...',
      }}
      getColumns={getColumns}
      fetchDataFn={useUserDataTable}
      exportConfig={{
        entityName: 'users',
        columnMapping: {
          email:       'Email',
          role:        'Role',
          isActive:    'Status',
          lastLoginAt: 'Last Login',
          createdAt:   'Created At',
        },
        columnWidths: [
          { wch: 40 },
          { wch: 15 },
          { wch: 12 },
          { wch: 20 },
          { wch: 20 },
        ],
        headers: ['Email', 'Role', 'Status', 'Last Login', 'Created At'],
      }}
      idField="id"
      renderToolbarContent={() => (
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      )}
    />
  )
}
