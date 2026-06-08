'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2 } from 'lucide-react'
import type { RouteConflict } from '../../schemas/sales.schema'

function ConflictBadge({ type }: { type: RouteConflict['conflictType'] }) {
  const styles = {
    route: 'bg-orange-500/10 text-orange-500 ring-orange-500/20',
    rep:   'bg-purple-500/10 text-purple-400 ring-purple-500/20',
    both:  'bg-rose-500/10  text-rose-400   ring-rose-500/20',
  }
  const labels = { route: 'Route', rep: 'Rep', both: 'Both' }
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function TagList({ items, color }: { items: string[]; color: 'orange' | 'purple' }) {
  const styles = {
    orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-200 dark:ring-orange-500/20',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-200 dark:ring-purple-500/20',
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ${styles[color]}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

interface ConflictTableProps {
  conflicts: RouteConflict[]
}

export function ConflictTable({ conflicts }: ConflictTableProps) {
  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/25">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold">No conflicts found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No outlets were served by multiple routes or reps in this period
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold w-[90px]">Code</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Customer</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold w-[80px]">Type</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Routes</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Reps</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold w-[60px] text-right">Bills</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold w-[180px]">Period</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold w-[110px] text-right">Total Gross</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conflicts.map((c) => (
            <TableRow key={c.customerCode} className="text-xs">
              <TableCell className="font-mono text-muted-foreground">{c.customerCode}</TableCell>
              <TableCell className="font-medium">{c.customerName}</TableCell>
              <TableCell><ConflictBadge type={c.conflictType} /></TableCell>
              <TableCell>
                {c.routes.length > 1
                  ? <TagList items={c.routes} color="orange" />
                  : <span className="text-muted-foreground">{c.routes[0]}</span>
                }
              </TableCell>
              <TableCell>
                {c.reps.length > 1
                  ? <TagList items={c.reps} color="purple" />
                  : <span className="text-muted-foreground">{c.reps[0]}</span>
                }
              </TableCell>
              <TableCell className="text-right tabular-nums">{c.billCount}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {c.firstDate === c.lastDate ? c.firstDate : `${c.firstDate} → ${c.lastDate}`}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {Number(c.totalGross).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
