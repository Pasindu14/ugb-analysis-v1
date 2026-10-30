'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import { BoundaryLayers } from './boundary-layers'
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

// Cluster bubble split into green (has sale) and red (no sale) counts
function createClusterIcon(cluster: { getAllChildMarkers(): L.Marker[] }) {
  const children = cluster.getAllChildMarkers()
  const sale = children.filter((m) => m.options.icon === greenIcon).length
  const noSale = children.length - sale

  const part = (count: number, color: string) =>
    count > 0
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 7px;border-radius:13px;background:${color};color:#fff;font:600 12px/1 system-ui,sans-serif">${count.toLocaleString()}</span>`
      : ''

  const parts = [part(sale, '#22c55e'), part(noSale, '#ef4444')].filter(Boolean).length
  const width = children.length.toString().length * 8 * parts + parts * 22 + 8

  return L.divIcon({
    className: '',
    html: `<div style="display:flex;gap:3px;align-items:center;justify-content:center;padding:3px;border-radius:17px;background:rgba(255,255,255,0.95);box-shadow:0 1px 6px rgba(0,0,0,0.4)">${part(sale, '#22c55e')}${part(noSale, '#ef4444')}</div>`,
    iconSize: [width, 32],
  })
}

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
  cluster?: boolean
}

export function OutletMap({ points, cluster = true }: OutletMapProps) {
  const markers = points.map((p) => (
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
                <span className="font-medium">Bills</span>
                <span>{p.billCount}</span>
                <span className="font-medium">Period</span>
                <span>{p.billCount > 1 ? `${p.firstDate} → ${p.lastDate}` : p.firstDate}</span>
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
  ))

  return (
    <div className="relative z-0 h-full w-full">
    <MapContainer
      center={[7.8731, 80.7718]}
      zoom={8}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <BoundaryLayers />

      <FitBounds points={points} />

      {cluster ? (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          disableClusteringAtZoom={17}
          removeOutsideVisibleBounds
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {markers}
        </MarkerClusterGroup>
      ) : (
        markers
      )}
    </MapContainer>
    </div>
  )
}
