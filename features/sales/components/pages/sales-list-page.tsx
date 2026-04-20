'use client'

import { SalesTable } from '../tables/sales-table'
import { ImportSalesDialog } from '../dialogs/import-dialog'

export function SalesListPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between bg-muted/50 p-10 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Area Customer Sales</h1>
          <p className="text-muted-foreground">Import and analyse area-wise customer sale reports</p>
        </div>
      </div>

      <SalesTable />
      <ImportSalesDialog />
    </div>
  )
}
