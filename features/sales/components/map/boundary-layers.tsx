'use client'

import { useEffect, useState } from 'react'
import { GeoJSON, LayersControl } from 'react-leaflet'
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

/**
 * Toggleable administrative-boundary overlays for Sri Lanka.
 *
 * Renders a Leaflet LayersControl (top-right) with one checkbox per level, so
 * the user can switch each boundary set on/off independently:
 *   - Districts (ADM2, 25 units)            — light, default ON
 *   - DS Divisions (ADM3, 330 units)        — denser, default OFF
 *
 * Data: geoBoundaries (Open Database License / Survey Department of Sri Lanka),
 * stored locally under `public/geo/*` so there is no runtime network dependency.
 * Every feature exposes its name on a `shapeName` property.
 */

type BoundaryConfig = {
  /** Label shown in the layers control + used as the GeoJSON cache key. */
  name: string
  /** Public path to the GeoJSON FeatureCollection. */
  file: string
  /** Whether the overlay starts enabled. */
  defaultOn: boolean
  style: PathOptions
  hover: PathOptions
  /** Optional suffix to strip from tooltip names (e.g. " District"). */
  stripSuffix?: RegExp
}

const DISTRICTS: BoundaryConfig = {
  name: 'District borders',
  file: '/geo/lk-districts.geojson',
  defaultOn: true,
  style: { color: '#2563eb', weight: 1.2, opacity: 0.7, fillColor: '#3b82f6', fillOpacity: 0.04 },
  hover: { weight: 2.5, opacity: 1, fillOpacity: 0.12 },
  stripSuffix: /\s*District$/,
}

const DS_DIVISIONS: BoundaryConfig = {
  name: 'DS Division borders',
  file: '/geo/lk-ds-divisions.geojson',
  defaultOn: false,
  style: { color: '#7c3aed', weight: 0.7, opacity: 0.55, fillColor: '#a855f7', fillOpacity: 0.03 },
  hover: { weight: 2, opacity: 1, fillOpacity: 0.1 },
}

const LAYERS: BoundaryConfig[] = [DISTRICTS, DS_DIVISIONS]

/** Fetches a GeoJSON file once; returns null until loaded (fails silently). */
function useGeoJson(url: string): FeatureCollection | null {
  const [data, setData] = useState<FeatureCollection | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then((res) => res.json())
      .then((json: FeatureCollection) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        // Boundaries are non-critical decoration; render nothing if missing.
      })
    return () => {
      cancelled = true
    }
  }, [url])
  return data
}

function BoundaryGeoJson({ config }: { config: BoundaryConfig }) {
  const data = useGeoJson(config.file)
  // react-leaflet's <GeoJSON> snapshots `data` on mount, so render it only once
  // the file has loaded — it then mounts fresh with the data already in place.
  if (!data) return null

  return (
    <GeoJSON
      data={data}
      style={() => config.style}
      onEachFeature={(feature: Feature<Geometry, { shapeName?: string }>, layer: Layer) => {
        const raw = feature.properties?.shapeName
        const name = config.stripSuffix && raw ? raw.replace(config.stripSuffix, '') : raw
        if (name) {
          layer.bindTooltip(name, { sticky: true, direction: 'top', className: 'boundary-tooltip' })
        }
        layer.on({
          mouseover: (e: LeafletMouseEvent) => e.target.setStyle(config.hover),
          mouseout: (e: LeafletMouseEvent) => e.target.setStyle(config.style),
        })
      }}
    />
  )
}

export function BoundaryLayers() {
  return (
    <LayersControl position="bottomright">
      {LAYERS.map((cfg) => (
        <LayersControl.Overlay key={cfg.name} name={cfg.name} checked={cfg.defaultOn}>
          <BoundaryGeoJson config={cfg} />
        </LayersControl.Overlay>
      ))}
    </LayersControl>
  )
}
