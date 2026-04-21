'use client'

import dynamic from 'next/dynamic'

export const SalesMapPageClient = dynamic(
  () =>
    import('./sales-map-page').then((m) => ({ default: m.SalesMapPage })),
  { ssr: false },
)
