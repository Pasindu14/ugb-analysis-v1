'use client'

import dynamic from 'next/dynamic'

export const ConflictMapClient = dynamic(
  () => import('./conflict-map').then((m) => ({ default: m.ConflictMap })),
  { ssr: false }
)
