'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Loader2, ChevronDown } from 'lucide-react'
import { useSalesFilterOptions, useSalesFilterOptionsByArea } from '../../hooks/sales.hooks'
import type { SalesFilterDto } from '../../schemas/sales.schema'

const ALL = '__all__'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </Label>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  loading = false,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0 md:flex-1">
      <FieldLabel>{label}</FieldLabel>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)} disabled={loading}>
        <SelectTrigger className="h-8 text-xs w-full">
          <SelectValue placeholder={loading ? 'Loading…' : `All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL} className="text-xs text-muted-foreground">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function AreaMultiSelect({
  value,
  options,
  onChange,
  loading = false,
}: {
  value: string[]
  options: string[]
  onChange: (v: string[]) => void
  loading?: boolean
}) {
  const allSelected = options.length > 0 && value.length === options.length
  const label =
    loading                ? 'Loading…'
    : value.length === 0   ? 'Select areas…'
    : allSelected          ? `All areas (${options.length})`
    : value.length === 1   ? value[0]
    : `${value.length} of ${options.length} areas`

  function toggle(area: string) {
    onChange(value.includes(area) ? value.filter((a) => a !== area) : [...value, area])
  }

  return (
    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1 min-w-0 md:flex-1">
      <div className="flex items-center gap-1">
        <FieldLabel>Area</FieldLabel>
        <span className="text-[10px] font-semibold text-amber-500">*</span>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={loading}
            className={[
              'flex h-8 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-xs disabled:opacity-50',
              value.length === 0 && !loading ? 'border-amber-400/60 ring-1 ring-amber-400/30' : '',
            ].join(' ')}
          >
            <span className={['truncate', value.length === 0 ? 'text-muted-foreground' : ''].join(' ')}>{label}</span>
            <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-72 flex-col p-0 shadow-xl"
          style={{ maxHeight: 'var(--radix-popover-content-available-height, 360px)' }}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <label className="flex flex-shrink-0 cursor-pointer items-center gap-2 border-b bg-muted/30 px-3 py-2">
            <Checkbox
              checked={allSelected ? true : value.length > 0 ? 'indeterminate' : false}
              onCheckedChange={() => onChange(allSelected ? [] : options)}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Select all · {options.length} areas
            </span>
          </label>
          <ScrollArea className="min-h-0 flex-1">
            <div className="py-1">
              {options.map((o) => (
                <label key={o} className="flex cursor-pointer items-center gap-2.5 px-3 py-[7px] text-xs hover:bg-accent transition-colors">
                  <Checkbox checked={value.includes(o)} onCheckedChange={() => toggle(o)} />
                  <span className="leading-snug">{o}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface MapFiltersProps {
  filters: SalesFilterDto
  onChange: (f: SalesFilterDto) => void
}

export function MapFilters({ filters, onChange }: MapFiltersProps) {
  const singleArea = filters.areaNames?.length === 1 ? filters.areaNames[0] : undefined
  const { data: globalOptions, isFetching: loadingGlobalOptions } = useSalesFilterOptions()
  const { data: areaOptions, isFetching: loadingAreaOptions } = useSalesFilterOptionsByArea(singleArea)

  function set(key: keyof SalesFilterDto, value: string | undefined) {
    onChange({ ...filters, [key]: value || undefined })
  }

  function reset() {
    onChange({
      reportDateFrom: filters.reportDateFrom,
      reportDateTo:   filters.reportDateTo,
    })
  }

  function handleAreaChange(v: string[]) {
    onChange({
      reportDateFrom: filters.reportDateFrom,
      reportDateTo:   filters.reportDateTo,
      areaNames:      v.length > 0 ? v : undefined,
    })
  }

  const { reportDateFrom, reportDateTo, ...nonDateFilters } = filters
  const activeCount = Object.values(nonDateFilters).filter((v) => v != null && v !== '').length
  const hasArea = !!singleArea

  return (
    <div className="grid grid-cols-2 md:flex md:flex-nowrap md:items-end gap-x-3 gap-y-3 border-b px-3 md:px-6 py-3 bg-card flex-none w-full">
      <div className="flex flex-col gap-1.5 min-w-0 md:flex-1">
        <FieldLabel>Period From</FieldLabel>
        <Input
          type="date"
          className="h-8 text-xs w-full"
          value={filters.reportDateFrom ?? ''}
          onChange={(e) => set('reportDateFrom', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5 min-w-0 md:flex-1">
        <FieldLabel>Period To</FieldLabel>
        <Input
          type="date"
          className="h-8 text-xs w-full"
          value={filters.reportDateTo ?? ''}
          onChange={(e) => set('reportDateTo', e.target.value)}
        />
      </div>

      <AreaMultiSelect
        value={filters.areaNames ?? []}
        options={globalOptions?.areaNames ?? []}
        onChange={handleAreaChange}
        loading={loadingGlobalOptions}
      />

      {hasArea && (
        <>
          <FilterSelect
            label="Route"
            value={filters.rootName ?? ''}
            options={areaOptions?.rootNames ?? []}
            onChange={(v) => set('rootName', v)}
            loading={loadingGlobalOptions || loadingAreaOptions}
          />
          <FilterSelect
            label="Distributor"
            value={filters.distributorName ?? ''}
            options={areaOptions?.distributorNames ?? []}
            onChange={(v) => set('distributorName', v)}
            loading={loadingGlobalOptions || loadingAreaOptions}
          />
          <FilterSelect
            label="Supervisor"
            value={filters.supervisorName ?? ''}
            options={areaOptions?.supervisorNames ?? []}
            onChange={(v) => set('supervisorName', v)}
            loading={loadingGlobalOptions || loadingAreaOptions}
          />
          <FilterSelect
            label="Rep"
            value={filters.repName ?? ''}
            options={areaOptions?.repNames ?? []}
            onChange={(v) => set('repName', v)}
            loading={loadingGlobalOptions || loadingAreaOptions}
          />
          <FilterSelect
            label="Outlet Type"
            value={filters.outletType ?? ''}
            options={areaOptions?.outletTypes ?? []}
            onChange={(v) => set('outletType', v)}
            loading={loadingGlobalOptions || loadingAreaOptions}
          />
        </>
      )}

      {activeCount > 0 && (
        <div className="col-span-2 flex md:items-end pb-0.5 md:flex-none md:shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear ({activeCount})
          </Button>
        </div>
      )}
    </div>
  )
}
