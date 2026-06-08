'use client'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input }    from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge }    from '@/components/ui/badge'
import { ChevronDown, Loader2, Plus, X, CalendarRange, Layers2 } from 'lucide-react'
import { useSalesFilterOptions } from '../../hooks/sales.hooks'
import type { AreaSelection } from '../../schemas/sales.schema'

// ── Area row ─────────────────────────────────────────────────────────────────

interface AreaRowProps {
  selection:     AreaSelection
  allAreaNames:  string[]
  usedAreas:     string[]
  areaRoutes:    string[]
  loadingRoutes: boolean
  rowColor:      string
  routeColors:   Record<string, string>
  onAreaChange:  (area: string) => void
  onToggleRoute: (route: string) => void
  onSelectAll:   () => void
  onClearAll:    () => void
  onRemove:      () => void
  canRemove:     boolean
}

function AreaRow({
  selection, allAreaNames, usedAreas, areaRoutes, loadingRoutes,
  rowColor, routeColors, onAreaChange, onToggleRoute, onSelectAll, onClearAll,
  onRemove, canRemove,
}: AreaRowProps) {
  const { area, routes: selectedRoutes } = selection

  const routeLabel =
    !area                                       ? 'Select area first'
    : loadingRoutes                             ? 'Loading…'
    : areaRoutes.length === 0                   ? 'No routes'
    : selectedRoutes.length === 0               ? 'Pick routes…'
    : selectedRoutes.length === areaRoutes.length ? 'All routes'
    : `${selectedRoutes.length} of ${areaRoutes.length}`

  return (
    <div className="group flex items-center gap-0 rounded-lg border bg-background shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Colored left accent */}
      <div className="w-1 self-stretch flex-shrink-0 transition-colors" style={{ background: rowColor }} />

      {/* Area selector */}
      <div className="flex-shrink-0 border-r">
        <Select value={area} onValueChange={onAreaChange}>
          <SelectTrigger className="h-9 w-[168px] rounded-none border-0 bg-transparent text-xs font-medium focus:ring-0 focus:ring-offset-0 shadow-none pl-3 pr-2">
            <SelectValue placeholder={
              <span className="text-muted-foreground/60 font-normal">Select area…</span>
            } />
          </SelectTrigger>
          <SelectContent>
            {allAreaNames.map((o) => (
              <SelectItem key={o} value={o} disabled={usedAreas.includes(o)} className="text-xs">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Route multi-select */}
      <div className="flex-1 min-w-0">
        <Popover>
          <PopoverTrigger asChild>
            <button
              disabled={!area || loadingRoutes || areaRoutes.length === 0}
              className="flex h-9 w-full items-center gap-2 px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/40 transition-colors"
            >
              {loadingRoutes
                ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground flex-shrink-0" />
                : <Layers2 className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
              }

              {/* Selected route color dots */}
              {selectedRoutes.length > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {selectedRoutes.slice(0, 8).map((r) => (
                    <span
                      key={r}
                      className="inline-block h-2 w-2 rounded-full border border-white/60 shadow-sm"
                      style={{ background: routeColors[`${area}::${r}`] ?? rowColor }}
                    />
                  ))}
                  {selectedRoutes.length > 8 && (
                    <span className="ml-0.5 text-[10px] text-muted-foreground">+{selectedRoutes.length - 8}</span>
                  )}
                </div>
              )}

              <span className={['truncate', selectedRoutes.length === 0 ? 'text-muted-foreground/60' : 'text-foreground font-medium'].join(' ')}>
                {routeLabel}
              </span>
              <ChevronDown className="ml-auto h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="flex w-80 flex-col p-0 shadow-xl"
            style={{ maxHeight: 'var(--radix-popover-content-available-height, 360px)' }}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b px-3 py-2 bg-muted/30">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: rowColor }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {areaRoutes.length} routes
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onSelectAll}
                  className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">All</button>
                <span className="text-muted-foreground/30 select-none">·</span>
                <button type="button" onClick={onClearAll}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">Clear</button>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="py-1">
                {areaRoutes.map((route) => {
                  const checked = selectedRoutes.includes(route)
                  const color   = routeColors[`${area}::${route}`] ?? rowColor
                  return (
                    <label key={route}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-[7px] text-xs hover:bg-accent transition-colors">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggleRoute(route)}
                        className="flex-shrink-0 data-[state=checked]:border-transparent"
                        style={checked ? { background: color, borderColor: color } : undefined}
                      />
                      <span
                        className="inline-block h-2 w-2 flex-shrink-0 rounded-full border border-white/70 shadow-sm"
                        style={{ background: color }}
                      />
                      <span className="leading-snug">{route}</span>
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected badge */}
      {selectedRoutes.length > 0 && (
        <div className="flex-shrink-0 border-l px-2.5">
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-semibold tabular-nums"
            style={{ background: `${rowColor}18`, color: rowColor, borderColor: `${rowColor}30` }}
          >
            {selectedRoutes.length}
          </Badge>
        </div>
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="flex h-9 w-8 flex-shrink-0 items-center justify-center border-l text-muted-foreground/40 transition-colors hover:bg-destructive/8 hover:text-destructive disabled:pointer-events-none disabled:opacity-20"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

// Stable palette to derive per-row accent color (independent of route colors)
const ROW_ACCENT = ['#6366f1','#f97316','#22c55e','#06b6d4','#f59e0b','#ec4899']

export interface ConflictFiltersProps {
  dateFrom:            string
  dateTo:              string
  selections:          AreaSelection[]
  routesByArea:        Record<string, string[]>
  loadingRoutesByArea: Record<string, boolean>
  routeColors:         Record<string, string>
  onDateFromChange:    (v: string) => void
  onDateToChange:      (v: string) => void
  onAddArea:           () => void
  onRemoveArea:        (idx: number) => void
  onAreaChange:        (idx: number, area: string) => void
  onToggleRoute:       (idx: number, route: string) => void
  onSelectAllRoutes:   (idx: number) => void
  onClearRoutes:       (idx: number) => void
}

export function ConflictFilters({
  dateFrom, dateTo, selections, routesByArea, loadingRoutesByArea, routeColors,
  onDateFromChange, onDateToChange,
  onAddArea, onRemoveArea, onAreaChange, onToggleRoute, onSelectAllRoutes, onClearRoutes,
}: ConflictFiltersProps) {
  const { data: globalOptions, isFetching: loadingOptions } = useSalesFilterOptions()
  const allAreaNames = globalOptions?.areaNames ?? []
  const usedAreas    = selections.map((s) => s.area).filter(Boolean)
  const canAddMore   = usedAreas.length < allAreaNames.length

  return (
    <div className="flex flex-col gap-2.5 border-b bg-muted/20 px-4 py-3 flex-none">

      {/* ── Top row: dates + add area ─────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Date range pill */}
        <div className="flex items-center gap-0 rounded-lg border bg-background shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 border-r px-3 text-muted-foreground/50 self-stretch">
            <CalendarRange className="h-3.5 w-3.5 flex-shrink-0" />
          </div>
          <div className="flex items-center">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-9 w-[130px] rounded-none border-0 bg-transparent text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
            />
            <span className="text-muted-foreground/40 text-xs select-none px-0.5">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-9 w-[130px] rounded-none border-0 bg-transparent text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add area */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canAddMore || loadingOptions}
          onClick={onAddArea}
          className="h-9 gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-solid shadow-sm"
        >
          {loadingOptions
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Plus className="h-3 w-3" />
          }
          Add area
        </Button>
      </div>

      {/* ── Area rows ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 w-1/2">
        {selections.map((sel, idx) => (
          <AreaRow
            key={idx}
            selection={sel}
            allAreaNames={allAreaNames}
            usedAreas={usedAreas.filter((a) => a !== sel.area)}
            areaRoutes={routesByArea[sel.area] ?? []}
            loadingRoutes={loadingRoutesByArea[sel.area] ?? false}
            rowColor={ROW_ACCENT[idx % ROW_ACCENT.length]}
            routeColors={routeColors}
            onAreaChange={(area)  => onAreaChange(idx, area)}
            onToggleRoute={(r)    => onToggleRoute(idx, r)}
            onSelectAll={()       => onSelectAllRoutes(idx)}
            onClearAll={()        => onClearRoutes(idx)}
            onRemove={()          => onRemoveArea(idx)}
            canRemove={selections.length > 1}
          />
        ))}
      </div>

    </div>
  )
}
