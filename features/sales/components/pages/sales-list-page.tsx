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
    <div className="flex flex-col gap-3 md:gap-4 p-3 md:p-6">
      <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,#1e293b_0%,#0f172a_55%,#020617_100%)] ring-1 ring-white/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.6)] flex-none">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/[0.08] blur-3xl" />

        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.45)]" />

        <div className="relative flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-5">
          <div className="flex items-center gap-3.5 md:gap-4">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-500/[0.08] to-transparent ring-1 ring-amber-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <BarChart2 className="h-5 w-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-400/70">
                Sales · Reports
              </p>
              <h1 className="mt-0.5 text-lg md:text-xl font-bold tracking-tight text-white">
                Area Customer Sales
              </h1>
              <p className="mt-0.5 text-xs text-slate-400/90 hidden md:block">
                Import and analyse area-wise customer sale reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={openManageImports}
              className="h-9 gap-1.5 rounded-lg border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white backdrop-blur-sm"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Manage Imports</span>
              <span className="sm:hidden">Imports</span>
            </Button>
          </div>
        </div>
      </div>

      <SalesTable />
      <ImportSalesDialog />
      <ManageImportsDialog />
    </div>
  )
}
