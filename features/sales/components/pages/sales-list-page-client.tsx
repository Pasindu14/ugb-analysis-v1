'use client'

import dynamic from 'next/dynamic'

export const SalesListPageClient = dynamic(
  () =>
    import('./sales-list-page').then((m) => ({ default: m.SalesListPage })),
  { ssr: false },
)
