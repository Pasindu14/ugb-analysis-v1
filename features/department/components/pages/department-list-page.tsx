'use client'

import { DepartmentTable } from '../tables/department-table'
import { DepartmentDialogs } from '../dialogs/department-dialogs'

export function DepartmentListPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between bg-muted/50 p-10 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
          <p className="text-muted-foreground">Manage your company departments</p>
        </div>
      </div>

      <DepartmentTable />
      <DepartmentDialogs />
    </div>
  )
}
