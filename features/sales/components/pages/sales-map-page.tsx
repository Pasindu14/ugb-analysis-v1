'use client'

import { useState } from 'react'
import { Map, MapPin } from 'lucide-react'
import { useSalesMapPoints } from '../../hooks/sales.hooks'
import { OutletMap } from '../map/outlet-map-client'
import { MapFilters } from '../map/map-filters'
import type { SalesFilterDto } from '../../schemas/sales.schema'

function currentMonthRange(): SalesFilterDto {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    reportDateFrom: `${y}-${m}-01`,
    reportDateTo:   `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function SalesMapPage() {
  const [filters, setFilters] = useState<SalesFilterDto>(currentMonthRange)
  const { data: points = [], isFetching } = useSalesMapPoints(filters)

  const saleCount   = points.filter((p) => Number(p.grossSaleAmount) > 0).length
  const noSaleCount = points.length - saleCount

  return (
    <div className="flex flex-col gap-4 p-6 h-[calc(100vh-49px)]">
      {/* Hero — matches sales list page */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-amber-600" />

        <div className="relative flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/25">
              <Map className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Outlet Map</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Geographic distribution of customer outlets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isFetching && (
              <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
            )}
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
          </div>
        </div>
      </div>

      {/* Map card — filters bar + map, fills remaining height */}
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border overflow-hidden bg-card shadow-sm">
        <MapFilters filters={filters} onChange={setFilters} />

        <div className="flex-1 min-h-0">
          {filters.areaName ? (
            <OutletMap points={points} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/25">
                <MapPin className="h-6 w-6 text-amber-500" />
              </div>
              <div className="text-center">
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
