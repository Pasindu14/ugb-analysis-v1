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

  return (
    <div className="flex flex-col gap-3 md:gap-4 p-3 md:p-6 h-[calc(100vh-49px)]">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-amber-600" />

        <div className="relative flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
          {/* Title */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/25">
              <Map className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">Outlet Map</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Geographic distribution of customer outlets
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white/30" />
                Has sale
                <span className="font-semibold text-emerald-400 tabular-nums">
                  {saleCount.toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white/30" />
                No sale
                <span className="font-semibold text-red-400 tabular-nums">
                  {noSaleCount.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white tabular-nums">
                {points.length.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Outlets</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={points.length === 0}
              onClick={() =>
                exportOutletsToExcel(points, {
                  reportDateFrom: filters.reportDateFrom,
                  reportDateTo:   filters.reportDateTo,
                  areaName:       filters.areaName,
                })
              }
              className="h-8 gap-1.5 bg-amber-400 text-slate-900 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
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
