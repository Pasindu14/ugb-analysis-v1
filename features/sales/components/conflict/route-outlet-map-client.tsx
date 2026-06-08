'use client'

import dynamic from 'next/dynamic'

export const RouteOutletMapClient = dynamic(
  () => import('./route-outlet-map').then((m) => ({ default: m.RouteOutletMap })),
  { ssr: false }
)
