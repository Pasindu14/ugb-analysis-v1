'use client'

import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { SalesMapPoint } from '../../schemas/sales.schema'

// ── Convex hull (Andrew's monotone chain) ────────────────────────────────────
type Pt = [number, number]

function cross(O: Pt, A: Pt, B: Pt): number {
  return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0])
}

function convexHull(points: Pt[]): Pt[] {
  if (points.length < 3) return points
  const pts = [...points].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])
  const lower: Pt[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop(); upper.pop()
  return [...lower, ...upper]
}
// ─────────────────────────────────────────────────────────────────────────────

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:9px;height:9px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.32)"></div>`,
    iconSize:    [9, 9],
    iconAnchor:  [4.5, 4.5],
    popupAnchor: [0, -8],
  })
}

function FitBounds({ outlets }: { outlets: SalesMapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (outlets.length === 0) return
    const bounds = L.latLngBounds(outlets.map((p) => [p.latitude, p.longitude]))
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 })
  }, [outlets, map])
  return null
}

interface RouteOutletMapProps {
  // keys are `${area}::${route}`
  outletsByKey: Record<string, SalesMapPoint[]>
  selectedKeys: string[]
  routeColors:  Record<string, string>
  routeLabels:  Record<string, string>
}

export function RouteOutletMap({ outletsByKey, selectedKeys, routeColors, routeLabels }: RouteOutletMapProps) {
  const allVisible = useMemo(
    () => selectedKeys.flatMap((k) => outletsByKey[k] ?? []),
    [selectedKeys, outletsByKey]
  )

  const routeLayers = useMemo(() =>
    [...new Set(selectedKeys)].map((key) => {
      const outlets = outletsByKey[key] ?? []
      const color   = routeColors[key] ?? '#6366f1'
      const label   = routeLabels[key] ?? key.split('::')[1] ?? key
      const hull    = convexHull(outlets.filter(o => o.latitude != null && o.longitude != null).map<Pt>((o) => [o.latitude!, o.longitude!]))
      const icon    = makeIcon(color)
      return { key, outlets, color, label, hull, icon }
    }),
    [selectedKeys, outletsByKey, routeColors, routeLabels]
  )

  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={8}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <FitBounds outlets={allVisible} />

        {routeLayers.map(({ key, outlets, color, label, hull, icon }) => (
          <React.Fragment key={key}>
            {hull.length >= 3 && (
              <Polygon
                positions={hull}
                pathOptions={{
                  color,
                  weight:      2,
                  opacity:     0.75,
                  fillColor:   color,
                  fillOpacity: 0.12,
                  dashArray:   '6 4',
                }}
              />
            )}

            {outlets.filter(p => p.latitude != null && p.longitude != null).map((p) => (
              <Marker key={`${key}-${p.id}`} position={[p.latitude!, p.longitude!]} icon={icon}>
                <Popup maxWidth={220}>
                  <div className="text-[13px] leading-relaxed">
                    <p className="font-semibold text-sm mb-1 text-gray-900">{p.customerName}</p>
                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-gray-600">
                      <span className="font-medium">Code</span><span>{p.customerCode}</span>
                      <span className="font-medium">Type</span><span>{p.outletType}</span>
                      <span className="font-medium">Rep</span> <span>{p.repName}</span>
                      <span className="font-medium">Route</span>
                      <span style={{ color }} className="font-semibold">{label}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Legend */}
      {routeLayers.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1001] rounded-lg bg-card/95 px-3 py-2.5 shadow-lg ring-1 ring-border backdrop-blur-sm max-w-[240px] max-h-[280px] overflow-y-auto">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 sticky top-0 bg-card/95 pb-1">
            Routes
          </p>
          <div className="flex flex-col gap-1.5">
            {routeLayers.map(({ key, color, label, outlets }) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-white shadow"
                  style={{ background: color }}
                />
                <span className="text-[11px] text-foreground/80 truncate" title={label}>{label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                  {outlets.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
