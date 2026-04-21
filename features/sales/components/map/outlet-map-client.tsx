'use client'

import dynamic from 'next/dynamic'
import type { SalesMapPoint } from '../../schemas/sales.schema'

const OutletMap = dynamic(
  () => import('./outlet-map').then((m) => ({ default: m.OutletMap })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted rounded-lg" /> },
)

export { OutletMap }
export type { SalesMapPoint }
