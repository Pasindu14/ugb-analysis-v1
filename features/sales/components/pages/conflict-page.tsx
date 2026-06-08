'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useQueryState } from 'nuqs'
import { GitMerge, Loader2, MapPin } from 'lucide-react'
import {
  useSalesMapPointsForAreas,
  useSalesRoutesForAreas,
} from '../../hooks/sales.hooks'
import { ConflictFilters } from '../conflict/conflict-filters'
import { RouteOutletMapClient } from '../conflict/route-outlet-map-client'
import type { AreaSelection, SalesMapPoint } from '../../schemas/sales.schema'

const PALETTE = [
  '#6366f1', '#f97316', '#22c55e', '#06b6d4',
  '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6',
  '#ef4444', '#84cc16', '#3b82f6', '#d946ef',
  '#a855f7', '#10b981', '#f43f5e', '#0ea5e9',
]

// ── URL serialization ────────────────────────────────────────────────────────
// Format: AreaA~Route1,Route2|AreaB~Route3  (percent-encoded per segment)
function serializeSelections(selections: AreaSelection[]): string {
  return selections
    .filter((s) => s.area)
    .map((s) => {
      const areaEnc   = encodeURIComponent(s.area)
      const routeEncs = s.routes.map(encodeURIComponent).join(',')
      return routeEncs ? `${areaEnc}~${routeEncs}` : areaEnc
    })
    .join('|')
}

function deserializeSelections(raw: string): AreaSelection[] {
  if (!raw) return [{ area: '', routes: [] }]
  return raw.split('|').map((part) => {
    const tilde = part.indexOf('~')
    if (tilde === -1) return { area: decodeURIComponent(part), routes: [] }
    const area   = decodeURIComponent(part.slice(0, tilde))
    const routes = part.slice(tilde + 1).split(',').filter(Boolean).map(decodeURIComponent)
    return { area, routes: [...new Set(routes)] }
  })
}
// ─────────────────────────────────────────────────────────────────────────────

function previousMonthRange() {
  const now  = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const y    = prev.getFullYear()
  const m    = String(prev.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, prev.getMonth() + 1, 0).getDate()
  return { dateFrom: `${y}-${m}-01`, dateTo: `${y}-${m}-${String(last).padStart(2, '0')}` }
}
const defaultRange = previousMonthRange()

export function ConflictPage() {
  const [dateFrom, setDateFrom] = useQueryState('from', { defaultValue: defaultRange.dateFrom })
  const [dateTo,   setDateTo]   = useQueryState('to',   { defaultValue: defaultRange.dateTo })
  const [selectionsParam, setSelectionsParam] = useQueryState('s', { defaultValue: '' })

  // Local state owns the selections (including empty/pending rows).
  // The URL only stores filled rows for shareability.
  const [selections, setSelections] = useState<AreaSelection[]>(
    () => deserializeSelections(selectionsParam)
  )

  // Keep URL in sync whenever filled selections change — skip on first mount.
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    setSelectionsParam(serializeSelections(selections))
  }, [selections])  // eslint-disable-line react-hooks/exhaustive-deps

  function updateSelections(next: AreaSelection[]) {
    setSelections(next)
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeAreas = useMemo(
    () => [...new Set(selections.map((s) => s.area).filter(Boolean))],
    [selections]
  )

  const isReady = !!dateFrom && !!dateTo && activeAreas.length > 0

  const hasSelectedRoutes = useMemo(
    () => selections.some((s) => s.routes.length > 0),
    [selections]
  )

  // ── Server data ────────────────────────────────────────────────────────────
  const areaOutletResults = useSalesMapPointsForAreas(activeAreas, dateFrom || undefined, dateTo || undefined)
  const areaRouteResults  = useSalesRoutesForAreas(activeAreas)

  const routesByArea = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const r of areaRouteResults) {
      if (r.data) map[r.data.area] = r.data.routes
    }
    return map
  }, [areaRouteResults])

  const loadingRoutesByArea = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (let i = 0; i < activeAreas.length; i++) {
      map[activeAreas[i]] = areaRouteResults[i]?.isFetching ?? false
    }
    return map
  }, [activeAreas, areaRouteResults])

  // Outlets keyed by `${area}::${route}` — grouped client-side from per-area fetch
  const outletsByKey = useMemo<Record<string, SalesMapPoint[]>>(() => {
    const map: Record<string, SalesMapPoint[]> = {}
    for (const r of areaOutletResults) {
      if (!r.data) continue
      const { area, outlets } = r.data
      for (const outlet of outlets) {
        const key = `${area}::${outlet.rootName}`
        if (!map[key]) map[key] = []
        map[key].push(outlet)
      }
    }
    return map
  }, [areaOutletResults])

  // Global color palette — colors assigned by iterating selections → routes in order
  const routeColors = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    let idx = 0
    for (const sel of selections) {
      const routes = routesByArea[sel.area] ?? []
      for (const route of routes) {
        const key = `${sel.area}::${route}`
        if (!map[key]) map[key] = PALETTE[idx++ % PALETTE.length]
      }
    }
    return map
  }, [selections, routesByArea])

  const routeLabels = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    const multiArea = activeAreas.length > 1
    for (const sel of selections) {
      for (const route of routesByArea[sel.area] ?? []) {
        const key = `${sel.area}::${route}`
        map[key] = multiArea ? `${route} · ${sel.area}` : route
      }
    }
    return map
  }, [selections, routesByArea, activeAreas])

  const selectedKeys = useMemo(
    () => selections.flatMap((s) => s.routes.map((r) => `${s.area}::${r}`)),
    [selections]
  )

  const selectedOutletCount = useMemo(
    () => selectedKeys.reduce((sum, k) => sum + (outletsByKey[k]?.length ?? 0), 0),
    [selectedKeys, outletsByKey]
  )

  const totalRouteCount = useMemo(
    () => activeAreas.reduce((sum, a) => sum + (routesByArea[a]?.length ?? 0), 0),
    [activeAreas, routesByArea]
  )

  const anyFetchingOutlets = areaOutletResults.some((r) => r.isFetching)
  const anyFetchingRoutes  = areaRouteResults.some((r) => r.isFetching)

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleAddArea() {
    updateSelections([...selections, { area: '', routes: [] }])
  }

  function handleRemoveArea(idx: number) {
    const next = selections.filter((_, i) => i !== idx)
    updateSelections(next.length > 0 ? next : [{ area: '', routes: [] }])
  }

  function handleAreaChange(idx: number, area: string) {
    const next = selections.map((s, i) => i === idx ? { area, routes: [] } : s)
    updateSelections(next)
  }

  function handleToggleRoute(idx: number, route: string) {
    const next = selections.map((s, i) => {
      if (i !== idx) return s
      const routes = s.routes.includes(route)
        ? s.routes.filter((r) => r !== route)
        : [...s.routes, route]
      return { ...s, routes }
    })
    updateSelections(next)
  }

  function handleSelectAllRoutes(idx: number) {
    const area   = selections[idx]?.area ?? ''
    const routes = routesByArea[area] ?? []
    const next   = selections.map((s, i) => i === idx ? { ...s, routes: [...routes] } : s)
    updateSelections(next)
  }

  function handleClearRoutes(idx: number) {
    const next = selections.map((s, i) => i === idx ? { ...s, routes: [] } : s)
    updateSelections(next)
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4 p-3 md:p-6 h-[calc(100vh-49px)]">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,#1e1a2e_0%,#0f172a_55%,#020617_100%)] ring-1 ring-white/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-24px_rgba(0,0,0,0.6)] flex-none">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-20 h-56 w-56 rounded-full bg-purple-500/[0.04] blur-3xl" />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-300 via-indigo-500 to-violet-700 shadow-[0_0_20px_rgba(99,102,241,0.45)]" />

        <div className="relative flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-5">
          <div className="flex items-center gap-3.5 md:gap-4">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 via-indigo-500/[0.08] to-transparent ring-1 ring-indigo-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <GitMerge className="h-5 w-5 text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-indigo-400/70">Sales · Territory Analysis</p>
              <h1 className="mt-0.5 text-lg md:text-xl font-bold tracking-tight text-white">Conflict Identifier</h1>
              <p className="mt-0.5 text-xs text-slate-400/90 hidden md:block">
                Visualise route boundaries and detect territory overlaps
              </p>
            </div>
          </div>

          {isReady && (
            <div className="flex items-stretch divide-x divide-white/[0.06] rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm">
              <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[88px] md:min-w-[104px]">
                <div className="flex items-center gap-1.5">
                  {anyFetchingRoutes
                    ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    : <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-indigo-400/20" />}
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Routes</span>
                </div>
                <span className="text-base md:text-lg font-semibold text-indigo-400 tabular-nums">{totalRouteCount}</span>
              </div>

              <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[72px] md:min-w-[88px]">
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Areas</span>
                <span className="text-base md:text-lg font-semibold text-violet-400 tabular-nums">{activeAreas.length}</span>
              </div>

              {hasSelectedRoutes && (
                <>
                  <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[88px] md:min-w-[104px]">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Selected</span>
                    <span className="text-base md:text-lg font-semibold text-fuchsia-400 tabular-nums">{selectedKeys.length}</span>
                  </div>

                  <div className="flex flex-col gap-1 px-3.5 py-2 md:px-4 md:py-2.5 min-w-[96px] md:min-w-[112px]">
                    <div className="flex items-center gap-1.5">
                      {anyFetchingOutlets
                        ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        : <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />}
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Outlets</span>
                    </div>
                    <span className="text-base md:text-lg font-semibold text-emerald-400 tabular-nums">{selectedOutletCount.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative h-[3px] w-full bg-white/[0.04]">
          {hasSelectedRoutes && (
            <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-indigo-500/80 to-violet-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all duration-500" />
          )}
        </div>
      </div>

      {/* Main card */}
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border overflow-hidden bg-card shadow-sm">
        <ConflictFilters
          dateFrom={dateFrom || ''}
          dateTo={dateTo || ''}
          selections={selections}
          routesByArea={routesByArea}
          loadingRoutesByArea={loadingRoutesByArea}
          routeColors={routeColors}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onAddArea={handleAddArea}
          onRemoveArea={handleRemoveArea}
          onAreaChange={handleAreaChange}
          onToggleRoute={handleToggleRoute}
          onSelectAllRoutes={handleSelectAllRoutes}
          onClearRoutes={handleClearRoutes}
        />

        {!isReady ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-400/10 ring-1 ring-indigo-400/25">
              <GitMerge className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Set the period and add an area to begin</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Period and at least one <span className="font-medium text-amber-500">Area</span> are required
              </p>
            </div>
          </div>
        ) : !hasSelectedRoutes ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-400/10 ring-1 ring-indigo-400/25">
              <MapPin className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Select routes to visualise their territories</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the <span className="font-medium text-indigo-400">Routes</span> dropdowns above — each route gets its own colour
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <RouteOutletMapClient
              outletsByKey={outletsByKey}
              selectedKeys={selectedKeys}
              routeColors={routeColors}
              routeLabels={routeLabels}
            />
          </div>
        )}
      </div>
    </div>
  )
}
