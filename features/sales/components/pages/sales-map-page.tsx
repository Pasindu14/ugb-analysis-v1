'use client'

import { useQueryState } from 'nuqs'
import { Map, MapPin, Loader2, Download } from 'lucide-react'
import { useSalesMapPoints } from '../../hooks/sales.hooks'
import { OutletMap } from '../map/outlet-map-client'
import { MapFilters } from '../map/map-filters'
import { Button } from '@/components/ui/button'
import { exportOutletsToExcel } from '../../utils/export-outlets'
import type { SalesFilterDto } from '../../schemas/sales.schema'

function previousMonthRange() {
  const now  = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const y    = prev.getFullYear()
  const m    = String(prev.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, prev.getMonth() + 1, 0).getDate()
  return {
    reportDateFrom: `${y}-${m}-01`,
    reportDateTo:   `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

const defaultRange = previousMonthRange()

export function SalesMapPage() {
  const [reportDateFrom, setReportDateFrom] = useQueryState('from',   { defaultValue: defaultRange.reportDateFrom })
  const [reportDateTo,   setReportDateTo]   = useQueryState('to',     { defaultValue: defaultRange.reportDateTo })
  const [areaName,       setAreaName]       = useQueryState('area',   { defaultValue: '' })
  const [rootName,       setRootName]       = useQueryState('route',  { defaultValue: '' })
  const [distributorName, setDistributorName] = useQueryState('distributor', { defaultValue: '' })
  const [supervisorName, setSupervisorName] = useQueryState('supervisor',    { defaultValue: '' })
  const [repName,        setRepName]        = useQueryState('rep',    { defaultValue: '' })
  const [outletType,     setOutletType]     = useQueryState('type',   { defaultValue: '' })

  const filters: SalesFilterDto = {
    reportDateFrom: reportDateFrom || undefined,
    reportDateTo:   reportDateTo   || undefined,
    areaName:       areaName       || undefined,
    rootName:       rootName       || undefined,
    distributorName: distributorName || undefined,
    supervisorName: supervisorName || undefined,
    repName:        repName        || undefined,
    outletType:     outletType     || undefined,
  }

  function setFilters(next: SalesFilterDto) {
    setReportDateFrom(next.reportDateFrom ?? '')
    setReportDateTo(next.reportDateTo ?? '')
    setAreaName(next.areaName ?? '')
    setRootName(next.rootName ?? '')
    setDistributorName(next.distributorName ?? '')
    setSupervisorName(next.supervisorName ?? '')
    setRepName(next.repName ?? '')
    setOutletType(next.outletType ?? '')
  }
  const { data: points = [], isFetching } = useSalesMapPoints(filters)

  const saleCount   = points.filter((p) => Number(p.grossSaleAmount) > 0).length
  const noSaleCount = points.length - saleCount
  const total       = points.length
  const salePct     = total > 0 ? (saleCount / total) * 100   : 0
  const noSalePct   = total > 0 ? (noSaleCount / total) * 100 : 0

  return (
    <div className="flex flex-col gap-3 md:gap-4 p-3 md:p-6 h-[calc(100vh-49px)]">
      {/* Hero — refined data-terminal aesthetic */}
      <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,#1e293b_0%,#0f172a_55%,#020617_100%)] ring-1 ring-white/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.6)] flex-none">
        {/* Background atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-20 h-56 w-56 rounded-full bg-emerald-500/[0.04] blur-3xl" />

        {/* Amber rail with backlight */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.45)]" />

        <div className="relative flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-5">
          {/* Brand */}
          <div className="flex items-center gap-3.5 md:gap-4">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-500/[0.08] to-transparent ring-1 ring-amber-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Map className="h-5 w-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-400/70">
                Sales · Geo Intelligence
              </p>
              <h1 className="mt-0.5 text-lg md:text-xl font-bold tracking-tight text-white">
                Outlet Map
              </h1>
              <p className="mt-0.5 text-xs text-slate-400/90 hidden md:block">
                Geographic distribution of customer outlets
              </p>
            </div>
          </div>

          {/* Stat strip + CTA */}
          <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
            <div className="flex items-stretch divide-x divide-white/[0.06] rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm">
              {/* Has sale */}
              <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[96px] md:min-w-[112px]">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/70 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Has sale
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base md:text-lg font-semibold text-emerald-400 tabular-nums">
                    {saleCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400/60 tabular-nums">
                    {Math.round(salePct)}%
                  </span>
                </div>
              </div>

              {/* No sale */}
              <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[96px] md:min-w-[112px]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    No sale
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base md:text-lg font-semibold text-rose-400 tabular-nums">
                    {noSaleCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-rose-400/60 tabular-nums">
                    {Math.round(noSalePct)}%
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[96px] md:min-w-[112px]">
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
                  Total Outlets
                </span>
                <span className="text-base md:text-lg font-bold text-white tabular-nums">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              disabled={points.length === 0}
              onClick={() =>
                exportOutletsToExcel(points, {
                  reportDateFrom: filters.reportDateFrom,
                  reportDateTo:   filters.reportDateTo,
                  areaName:       filters.areaName,
                })
              }
              className="h-9 gap-1.5 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 px-3.5 font-semibold text-slate-950 shadow-[0_4px_14px_-2px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] ring-1 ring-amber-300/60 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-[0_6px_20px_-2px_rgba(251,191,36,0.55),inset_0_1px_0_rgba(255,255,255,0.6)] disabled:bg-none disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none disabled:ring-slate-600"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
        </div>

        {/* Bottom split-meter — visualizes the percentage breakdown */}
        <div className="relative h-[3px] w-full bg-white/[0.04]">
          {total > 0 && (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-500 ease-out"
                style={{ width: `${salePct}%` }}
              />
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-rose-500/80 to-rose-400/80 transition-all duration-500 ease-out"
                style={{ left: `${salePct}%`, width: `${noSalePct}%` }}
              />
            </>
          )}
        </div>
      </div>

      {/* Map card — filters bar + map, fills remaining height */}
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border overflow-hidden bg-card shadow-sm">
        <MapFilters filters={filters} onChange={setFilters} />

        <div className="relative flex-1 min-h-0">
          {filters.areaName ? (
            <>
              <OutletMap points={points} />
              {isFetching && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 rounded-xl bg-card px-5 py-3 shadow-lg ring-1 ring-border">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="text-sm font-medium">Loading area data…</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/25">
                <MapPin className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Select an area to load the map</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the{' '}
                  <span className="font-medium text-amber-500">Area *</span>{' '}
                  filter above to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
