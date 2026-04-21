'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { SalesMapPoint } from '../../schemas/sales.schema'

function makeDotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  })
}

const greenIcon = makeDotIcon('#22c55e')
const redIcon   = makeDotIcon('#ef4444')

function FitBounds({ points }: { points: SalesMapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
  }, [points, map])
  return null
}

interface OutletMapProps {
  points: SalesMapPoint[]
}

export function OutletMap({ points }: OutletMapProps) {
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

      <FitBounds points={points} />

      {points.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={Number(p.grossSaleAmount) > 0 ? greenIcon : redIcon}>
          <Popup maxWidth={260} className="outlet-popup">
            <div className="text-[13px] leading-relaxed">
              <p className="font-semibold text-sm mb-1 text-gray-900">{p.customerName}</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-gray-600">
                <span className="font-medium">Code</span>
                <span>{p.customerCode}</span>
                <span className="font-medium">Area</span>
                <span>{p.areaName}</span>
                <span className="font-medium">Type</span>
                <span>{p.outletType}</span>
                <span className="font-medium">Rep</span>
                <span>{p.repName}</span>
                <span className="font-medium">Distributor</span>
                <span>{p.distributorName}</span>
                <span className="font-medium">Period</span>
                <span>{p.reportDate}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Gross Sale</p>
                  <p className="font-semibold text-emerald-600">
                    {Number(p.grossSaleAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Net Sale</p>
                  <p className="font-semibold text-emerald-600">
                    {Number(p.netSaleAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </div>
  )
}
