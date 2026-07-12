import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react'
import { Cursor, Minus, Plus } from '@phosphor-icons/react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import styles from './InteractiveMap.module.css'

const MAPBOX_TOKEN =
  'pk.eyJ1IjoicGl4b25hbCIsImEiOiJjbHJocDZvY2cwMXAzMm1zMWZnZDhxNngxIn0.PcC8G5xFaPmXUGOY2h2tmw'
const MAPBOX_STYLE = 'mapbox://styles/pixonal/cmqzd3vp2003g01s7f4oy3af9'

/** Mussafah–ICAD corridor, Abu Dhabi */
const DEFAULT_CENTER: [number, number] = [54.472, 24.355]
const DEFAULT_ZOOM = 11.2

export type InteractiveMapHandle = {
  zoomIn: () => void
  zoomOut: () => void
  resetNorth: () => void
}

export type InteractiveMapProps = {
  className?: string
  center?: [number, number]
  zoom?: number
  /** When false, host UI should render MapControls separately. */
  showControls?: boolean
}

export function MapControls({
  className,
  style,
  disabled,
  onZoomIn,
  onZoomOut,
  onResetNorth,
}: {
  className?: string
  style?: CSSProperties
  disabled?: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetNorth: () => void
}) {
  return (
    <div
      className={[styles.controls, className].filter(Boolean).join(' ')}
      style={style}
      role="group"
      aria-label="Map controls"
    >
      <button
        type="button"
        className={styles.controlBtn}
        onClick={onResetNorth}
        disabled={disabled}
        aria-label="Reset map orientation"
      >
        <Cursor size={18} weight="regular" aria-hidden />
      </button>
      <button
        type="button"
        className={styles.controlBtn}
        onClick={onZoomIn}
        disabled={disabled}
        aria-label="Zoom in"
      >
        <Plus size={18} weight="regular" aria-hidden />
      </button>
      <button
        type="button"
        className={styles.controlBtn}
        onClick={onZoomOut}
        disabled={disabled}
        aria-label="Zoom out"
      >
        <Minus size={18} weight="regular" aria-hidden />
      </button>
    </div>
  )
}

export const InteractiveMap = forwardRef<InteractiveMapHandle, InteractiveMapProps>(function InteractiveMap(
  { className, center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, showControls = true },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady] = useState(false)

  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 280 })
  }, [])

  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 280 })
  }, [])

  const resetNorth = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ bearing: 0, pitch: 0, duration: 420 })
  }, [])

  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, resetNorth }), [zoomIn, zoomOut, resetNorth])

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: el,
      style: MAPBOX_STYLE,
      center,
      zoom,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', () => {
      map.resize()
      setReady(true)
    })

    mapRef.current = map

    const observer = new ResizeObserver(() => {
      map.resize()
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [center, zoom])

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div ref={containerRef} className={styles.canvas} />
      {showControls ? (
        <MapControls
          disabled={!ready}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetNorth={resetNorth}
        />
      ) : null}
    </div>
  )
})
