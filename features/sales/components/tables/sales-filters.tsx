'use client'

import { useEffect, useRef } from 'react'
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

function currentMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    reportDateFrom: `${y}-${m}-01`,
    reportDateTo:   `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

const ALL = '__all__'

interface SalesFiltersProps {
  filters: Record<string, unknown>
  setFilters: (f: Record<string, unknown>) => void
}

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
  width = 'w-[140px]',
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  width?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
        <SelectTrigger className={`h-8 text-xs ${width}`}>
          <SelectValue placeholder={`All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL} className="text-xs text-muted-foreground">
            All
          </SelectItem>
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
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    setFilters(currentMonthRange())
  }, [setFilters])

  function set(key: string, value: string | number | undefined) {
    setFilters({ ...filters, [key]: value || undefined })
  }

  function reset() {
    setFilters({})
  }

  const activeCount = Object.values(filters).filter((v) => v != null && v !== '').length

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-3 w-full py-2">
      {/* Period From */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Period From</FieldLabel>
        <Input
          type="date"
          className="h-8 text-xs w-[132px]"
          value={(filters.reportDateFrom as string) ?? ''}
          onChange={(e) => set('reportDateFrom', e.target.value)}
        />
      </div>

      {/* Period To */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Period To</FieldLabel>
        <Input
          type="date"
          className="h-8 text-xs w-[132px]"
          value={(filters.reportDateTo as string) ?? ''}
          onChange={(e) => set('reportDateTo', e.target.value)}
        />
      </div>

      <FilterSelect
        label="Area"
        value={(filters.areaName as string) ?? ''}
        options={options?.areaNames ?? []}
        onChange={(v) => set('areaName', v)}
        width="w-[130px]"
      />

      <FilterSelect
        label="Distributor"
        value={(filters.distributorName as string) ?? ''}
        options={options?.distributorNames ?? []}
        onChange={(v) => set('distributorName', v)}
        width="w-[148px]"
      />

      <FilterSelect
        label="Supervisor"
        value={(filters.supervisorName as string) ?? ''}
        options={options?.supervisorNames ?? []}
        onChange={(v) => set('supervisorName', v)}
        width="w-[148px]"
      />

      <FilterSelect
        label="Rep"
        value={(filters.repName as string) ?? ''}
        options={options?.repNames ?? []}
        onChange={(v) => set('repName', v)}
        width="w-[130px]"
      />

      <FilterSelect
        label="Route"
        value={(filters.rootName as string) ?? ''}
        options={options?.rootNames ?? []}
        onChange={(v) => set('rootName', v)}
        width="w-[120px]"
      />

      <FilterSelect
        label="Outlet Type"
        value={(filters.outletType as string) ?? ''}
        options={options?.outletTypes ?? []}
        onChange={(v) => set('outletType', v)}
        width="w-[148px]"
      />

      {/* Gross Sale range */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Gross Min</FieldLabel>
        <Input
          type="number"
          className="h-8 text-xs w-[88px]"
          placeholder="0"
          value={(filters.grossMin as string) ?? ''}
          onChange={(e) =>
            set('grossMin', e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Gross Max</FieldLabel>
        <Input
          type="number"
          className="h-8 text-xs w-[88px]"
          placeholder="∞"
          value={(filters.grossMax as string) ?? ''}
          onChange={(e) =>
            set('grossMax', e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </div>

      {/* Net Sale range */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Net Min</FieldLabel>
        <Input
          type="number"
          className="h-8 text-xs w-[88px]"
          placeholder="0"
          value={(filters.netMin as string) ?? ''}
          onChange={(e) =>
            set('netMin', e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Net Max</FieldLabel>
        <Input
          type="number"
          className="h-8 text-xs w-[88px]"
          placeholder="∞"
          value={(filters.netMax as string) ?? ''}
          onChange={(e) =>
            set('netMax', e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </div>

      {activeCount > 0 && (
        <div className="flex items-end pb-0.5">
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
