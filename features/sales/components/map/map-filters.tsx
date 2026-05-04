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
import { X, Loader2 } from 'lucide-react'
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
    <div className="flex flex-col gap-1.5">
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

function AreaSelect({
  value,
  options,
  onChange,
  loading = false,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
      <div className="flex items-center gap-1">
        <FieldLabel>Area</FieldLabel>
        <span className="text-[10px] font-semibold text-amber-500">*</span>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <Select value={value || ''} onValueChange={onChange} disabled={loading}>
        <SelectTrigger
          className={[
            'h-8 text-xs w-full',
            !value && !loading ? 'border-amber-400/60 ring-1 ring-amber-400/30' : '',
          ].join(' ')}
        >
          <SelectValue placeholder={loading ? 'Loading…' : 'Select area…'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface MapFiltersProps {
  filters: SalesFilterDto
  onChange: (f: SalesFilterDto) => void
}

export function MapFilters({ filters, onChange }: MapFiltersProps) {
  const { data: globalOptions, isFetching: loadingGlobalOptions } = useSalesFilterOptions()
  const { data: areaOptions, isFetching: loadingAreaOptions } = useSalesFilterOptionsByArea(filters.areaName)

  function set(key: keyof SalesFilterDto, value: string | undefined) {
    onChange({ ...filters, [key]: value || undefined })
  }

  function reset() {
    onChange({
      reportDateFrom: filters.reportDateFrom,
      reportDateTo:   filters.reportDateTo,
    })
  }

  function handleAreaChange(v: string) {
    onChange({
      reportDateFrom: filters.reportDateFrom,
      reportDateTo:   filters.reportDateTo,
      areaName:       v || undefined,
    })
  }

  const { reportDateFrom, reportDateTo, ...nonDateFilters } = filters
  const activeCount = Object.values(nonDateFilters).filter((v) => v != null && v !== '').length
  const hasArea = !!filters.areaName

  return (
    <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-end gap-x-3 gap-y-3 border-b px-3 md:px-6 py-3 bg-card flex-none">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Period From</FieldLabel>
        <Input
          type="date"
          className="h-8 text-xs w-full"
          value={filters.reportDateFrom ?? ''}
          onChange={(e) => set('reportDateFrom', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Period To</FieldLabel>
        <Input
          type="date"
          className="h-8 text-xs w-full"
          value={filters.reportDateTo ?? ''}
          onChange={(e) => set('reportDateTo', e.target.value)}
        />
      </div>

      <AreaSelect
        value={filters.areaName ?? ''}
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
        <div className="col-span-2 flex md:items-end pb-0.5">
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
