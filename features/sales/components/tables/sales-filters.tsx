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
import { X } from 'lucide-react'
import { useSalesFilterOptions } from '../../hooks/sales.hooks'

const ALL = '__all__'

interface SalesFiltersProps {
  filters: Record<string, unknown>
  setFilters: (f: Record<string, unknown>) => void
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={`All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SalesFilters({ filters, setFilters }: SalesFiltersProps) {
  const { data: options } = useSalesFilterOptions()

  function set(key: string, value: string | number | undefined) {
    setFilters({ ...filters, [key]: value || undefined })
  }

  function reset() {
    setFilters({})
  }

  const hasActiveFilter = Object.values(filters).some((v) => v != null && v !== '')

  return (
    <div className="flex flex-wrap items-end gap-3 py-2">
      {/* Date range */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Period From</Label>
        <Input
          type="date"
          className="h-8 text-xs w-36"
          value={(filters.reportDateFrom as string) ?? ''}
          onChange={(e) => set('reportDateFrom', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Period To</Label>
        <Input
          type="date"
          className="h-8 text-xs w-36"
          value={(filters.reportDateTo as string) ?? ''}
          onChange={(e) => set('reportDateTo', e.target.value)}
        />
      </div>

      <FilterSelect
        label="Area"
        value={(filters.areaName as string) ?? ''}
        options={options?.areaNames ?? []}
        onChange={(v) => set('areaName', v)}
      />
      <FilterSelect
        label="Supervisor"
        value={(filters.supervisorName as string) ?? ''}
        options={options?.supervisorNames ?? []}
        onChange={(v) => set('supervisorName', v)}
      />
      <FilterSelect
        label="Distributor"
        value={(filters.distributorName as string) ?? ''}
        options={options?.distributorNames ?? []}
        onChange={(v) => set('distributorName', v)}
      />
      <FilterSelect
        label="Rep"
        value={(filters.repName as string) ?? ''}
        options={options?.repNames ?? []}
        onChange={(v) => set('repName', v)}
      />
      <FilterSelect
        label="Route"
        value={(filters.rootName as string) ?? ''}
        options={options?.rootNames ?? []}
        onChange={(v) => set('rootName', v)}
      />
      <FilterSelect
        label="Outlet Type"
        value={(filters.outletType as string) ?? ''}
        options={options?.outletTypes ?? []}
        onChange={(v) => set('outletType', v)}
      />

      {/* Amount ranges */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Gross Min</Label>
        <Input
          type="number"
          className="h-8 text-xs w-24"
          placeholder="0"
          value={(filters.grossMin as string) ?? ''}
          onChange={(e) => set('grossMin', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Gross Max</Label>
        <Input
          type="number"
          className="h-8 text-xs w-24"
          placeholder="∞"
          value={(filters.grossMax as string) ?? ''}
          onChange={(e) => set('grossMax', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Net Min</Label>
        <Input
          type="number"
          className="h-8 text-xs w-24"
          placeholder="0"
          value={(filters.netMin as string) ?? ''}
          onChange={(e) => set('netMin', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Net Max</Label>
        <Input
          type="number"
          className="h-8 text-xs w-24"
          placeholder="∞"
          value={(filters.netMax as string) ?? ''}
          onChange={(e) => set('netMax', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      {hasActiveFilter && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 gap-1 text-xs">
          <X className="h-3 w-3" /> Clear filters
        </Button>
      )}
    </div>
  )
}
