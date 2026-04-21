'use client'

import { BarChart2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalesTable } from '../tables/sales-table'
import { ImportSalesDialog } from '../dialogs/import-dialog'
import { ManageImportsDialog } from '../dialogs/manage-imports-dialog'
import { useManageImportsDialog } from '../../store'

export function SalesListPage() {
  const { open: openManageImports } = useManageImportsDialog()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-amber-600" />

        <div className="relative flex items-center justify-between px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/25">
              <BarChart2 className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Area Customer Sales
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Import and analyse area-wise customer sale reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={openManageImports}
              className="gap-1.5 border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Manage Imports
            </Button>
            <div className="hidden md:grid grid-cols-5 gap-[7px] opacity-[0.15]">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SalesTable />
      <ImportSalesDialog />
      <ManageImportsDialog />
    </div>
  )
}
