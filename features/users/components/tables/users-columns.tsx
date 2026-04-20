'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { MoreHorizontal, Edit, UserCheck, UserX, KeyRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserSafe } from '@/db/schema'
import { ROLE_LABELS, ROLE_VARIANTS } from '../../constants'

export interface UserColumnActions {
  openEdit:           (id: number) => void
  openActivate:       (id: number) => void
  openDeactivate:     (id: number) => void
  openChangePassword: (id: number) => void
}

export function getUserColumns(actions: UserColumnActions): ColumnDef<UserSafe>[] {
  const { openEdit, openActivate, openDeactivate, openChangePassword } = actions

  return [
    {
      id:            'user',
      size:          320,
      header:        ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const { email, role, id } = row.original
        const initials = email.substring(0, 2).toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {initials}
            </div>
            <div>
              <div className="text-sm font-medium">{email}</div>
              <div className="text-xs text-muted-foreground">
                ID: {id} &bull; {ROLE_LABELS[role] ?? role}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      size:        140,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as keyof typeof ROLE_LABELS
        return (
          <Badge variant={ROLE_VARIANTS[role] ?? 'outline'}>
            {ROLE_LABELS[role] ?? role}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'isActive',
      size:        100,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'lastLoginAt',
      size:        160,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => {
        const val = row.getValue('lastLoginAt') as string | null
        return (
          <div className="text-sm text-muted-foreground">
            {val ? new Date(val).toLocaleDateString() : 'Never'}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      size:        140,
      header:      ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('createdAt')).toLocaleDateString()}
        </div>
      ),
    },
    {
      id:           'actions',
      size:         60,
      enableHiding: false,
      cell: ({ row }) => {
        const { id, isActive } = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(id)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openChangePassword(id)}>
                <KeyRound className="mr-2 h-4 w-4" /> Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem
                  onClick={() => openDeactivate(id)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" /> Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => openActivate(id)}>
                  <UserCheck className="mr-2 h-4 w-4" /> Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
