'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BoundaryLayers } from '../map/boundary-layers'
import type { RouteConflict } from '../../schemas/sales.schema'

function makeDotIcon(color: string, size = 12) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

const routeIcon = makeDotIcon('#f97316') // orange — route conflict
const repIcon   = makeDotIcon('#a855f7') // purple — rep conflict
const bothIcon  = makeDotIcon('#ef4444') // red    — both

function getIcon(c: RouteConflict) {
  if (c.conflictType === 'both')  return bothIcon
  if (c.conflictType === 'route') return routeIcon
  return repIcon
}

function FitBounds({ points }: { points: RouteConflict[] }) {
  const map = useMap()
  useEffect(() => {
    const located = points.filter((p) => p.latitude != null && p.longitude != null)
    if (located.length === 0) return
    const bounds = L.latLngBounds(located.map((p) => [p.latitude!, p.longitude!]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
  }, [points, map])
  return null
}

interface ConflictMapProps {
  conflicts: RouteConflict[]
}

export function ConflictMap({ conflicts }: ConflictMapProps) {
  const located = conflicts.filter((c) => c.latitude != null && c.longitude != null)

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

        <BoundaryLayers />

        <FitBounds points={conflicts} />

        {located.map((c) => (
          <Marker key={c.customerCode} position={[c.latitude!, c.longitude!]} icon={getIcon(c)}>
            <Popup maxWidth={280} className="conflict-popup">
              <div className="text-[13px] leading-relaxed">
                <p className="font-semibold text-sm mb-1 text-gray-900">{c.customerName}</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-gray-600">
                  <span className="font-medium">Code</span>
                  <span>{c.customerCode}</span>
                  <span className="font-medium">Area</span>
                  <span>{c.areaName}</span>
                  <span className="font-medium">Bills</span>
                  <span>{c.billCount}</span>
                  <span className="font-medium">Period</span>
                  <span>{c.firstDate === c.lastDate ? c.firstDate : `${c.firstDate} → ${c.lastDate}`}</span>
                </div>

                {c.routes.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-500 mb-1">Conflicting Routes</p>
                    <div className="flex flex-wrap gap-1">
                      {c.routes.map((r) => (
                        <span key={r} className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.reps.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500 mb-1">Conflicting Reps</p>
                    <div className="flex flex-wrap gap-1">
                      {c.reps.map((r) => (
                        <span key={r} className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total Gross</p>
                  <p className="font-semibold text-emerald-600">
                    {Number(c.totalGross).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1001] rounded-lg bg-card/95 px-3 py-2.5 shadow-lg ring-1 ring-border backdrop-blur-sm">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Conflict Type</p>
        <div className="flex flex-col gap-1">
          {[
            { color: '#f97316', label: 'Route conflict' },
            { color: '#a855f7', label: 'Rep conflict' },
            { color: '#ef4444', label: 'Both' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-white shadow"
                style={{ background: color }}
              />
              <span className="text-[11px] text-foreground/80">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
