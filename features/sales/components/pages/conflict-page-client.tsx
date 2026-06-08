'use client'

import dynamic from 'next/dynamic'

export const ConflictPageClient = dynamic(
  () => import('./conflict-page').then((m) => ({ default: m.ConflictPage })),
  { ssr: false }
)
