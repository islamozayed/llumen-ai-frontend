/** Shared demo stations + generated query/profile table for the AQ monitoring map. */

export type AirQualityMapStation = {
  id: string
  location: string
  locationShort: string
  /** Spatial corridor / coverage zone */
  corridor: string
  /** Approximate station coordinates (Abu Dhabi) */
  coordinates: string
  aqi: number
  no2: number
  pm25: number
  status: 'Good' | 'Moderate' | 'USG' | 'Unhealthy' | 'Very Unhealthy'
  /** Relative sampling weight (used to allocate ~1,560 rows) */
  weight: number
}

export const AIR_QUALITY_MAP_STATUS_LABEL: Record<AirQualityMapStation['status'], string> = {
  Good: 'Good',
  Moderate: 'Moderate',
  USG: 'Unhealthy for Sensitive',
  Unhealthy: 'Unhealthy',
  'Very Unhealthy': 'Very Unhealthy',
}

export const AIR_QUALITY_MAP_COLUMNS = [
  'Station',
  'Location',
  'Coordinates',
  'Corridor coverage',
  'Observation time',
  'Last calibrated',
  'AQI',
  'NO₂ (µg/m³)',
  'PM₂.₅ (µg/m³)',
  'Status',
] as const

/**
 * 21 stations × 21 locations. Baseline readings drive generated sample rows.
 */
export const AIR_QUALITY_MAP_STATIONS: AirQualityMapStation[] = [
  { id: 'AQ-01', location: 'Yas Island west', locationShort: 'Yas W', corridor: 'Island coastal', coordinates: '24.490, 54.607', aqi: 42, no2: 24, pm25: 8, status: 'Good', weight: 48 },
  { id: 'AQ-02', location: 'Reem Island', locationShort: 'Reem', corridor: 'Island coastal', coordinates: '24.494, 54.407', aqi: 58, no2: 36, pm25: 12, status: 'Moderate', weight: 52 },
  { id: 'AQ-03', location: 'Mina Zayed approach', locationShort: 'Mina', corridor: 'Port corridor', coordinates: '24.524, 54.372', aqi: 121, no2: 198, pm25: 44, status: 'USG', weight: 96 },
  { id: 'AQ-04', location: 'Port Zayed', locationShort: 'Port', corridor: 'Port corridor', coordinates: '24.531, 54.385', aqi: 88, no2: 72, pm25: 22, status: 'Moderate', weight: 58 },
  { id: 'AQ-05', location: 'Al Raha Beach', locationShort: 'Raha', corridor: 'Island coastal', coordinates: '24.441, 54.571', aqi: 64, no2: 41, pm25: 14, status: 'Moderate', weight: 54 },
  { id: 'AQ-06', location: 'Khalifa City', locationShort: 'Khalifa', corridor: 'Eastern suburbs', coordinates: '24.420, 54.578', aqi: 76, no2: 58, pm25: 18, status: 'Moderate', weight: 64 },
  { id: 'AQ-07', location: 'Downtown Corniche', locationShort: 'Corniche', corridor: 'Central urban', coordinates: '24.476, 54.321', aqi: 64, no2: 48, pm25: 14, status: 'Moderate', weight: 74 },
  { id: 'AQ-08', location: 'Al Bateen', locationShort: 'Bateen', corridor: 'Central urban', coordinates: '24.453, 54.338', aqi: 71, no2: 52, pm25: 16, status: 'Moderate', weight: 70 },
  { id: 'AQ-09', location: 'ICAD corridor', locationShort: 'ICAD', corridor: 'Mussafah–ICAD', coordinates: '24.338, 54.486', aqi: 142, no2: 310, pm25: 58, status: 'USG', weight: 112 },
  { id: 'AQ-10', location: 'Mussafah South', locationShort: 'Muss. S', corridor: 'Mussafah–ICAD', coordinates: '24.326, 54.502', aqi: 134, no2: 246, pm25: 52, status: 'USG', weight: 84 },
  { id: 'AQ-11', location: 'Mussafah Central', locationShort: 'Muss. C', corridor: 'Mussafah–ICAD', coordinates: '24.348, 54.518', aqi: 156, no2: 348, pm25: 64, status: 'Unhealthy', weight: 76 },
  { id: 'AQ-12', location: 'Mussafah East', locationShort: 'Muss. E', corridor: 'Mussafah–ICAD', coordinates: '24.355, 54.545', aqi: 128, no2: 220, pm25: 48, status: 'USG', weight: 68 },
  { id: 'AQ-13', location: 'MBZ City', locationShort: 'MBZ', corridor: 'Eastern suburbs', coordinates: '24.334, 54.555', aqi: 98, no2: 110, pm25: 31, status: 'Moderate', weight: 88 },
  { id: 'AQ-14', location: 'Mussafah industrial', locationShort: 'Muss. Ind', corridor: 'Mussafah–ICAD', coordinates: '24.342, 54.472', aqi: 168, no2: 430, pm25: 70, status: 'Unhealthy', weight: 108 },
  { id: 'AQ-15', location: 'ICAD West', locationShort: 'ICAD W', corridor: 'Mussafah–ICAD', coordinates: '24.351, 54.458', aqi: 138, no2: 286, pm25: 55, status: 'USG', weight: 80 },
  { id: 'AQ-16', location: 'Al Shahama', locationShort: 'Shahama', corridor: 'Northern suburbs', coordinates: '24.556, 54.678', aqi: 82, no2: 64, pm25: 19, status: 'Moderate', weight: 62 },
  { id: 'AQ-17', location: 'Al Bahia', locationShort: 'Bahia', corridor: 'Northern suburbs', coordinates: '24.580, 54.652', aqi: 54, no2: 32, pm25: 11, status: 'Moderate', weight: 56 },
  { id: 'AQ-18', location: 'Saadiyat North', locationShort: 'Saad. N', corridor: 'Island coastal', coordinates: '24.552, 54.436', aqi: 48, no2: 22, pm25: 9, status: 'Good', weight: 54 },
  { id: 'AQ-19', location: 'Saadiyat South', locationShort: 'Saad. S', corridor: 'Island coastal', coordinates: '24.531, 54.428', aqi: 61, no2: 38, pm25: 13, status: 'Moderate', weight: 60 },
  { id: 'AQ-20', location: 'Al Maryah Island', locationShort: 'Maryah', corridor: 'Central urban', coordinates: '24.501, 54.389', aqi: 69, no2: 46, pm25: 15, status: 'Moderate', weight: 66 },
  { id: 'AQ-21', location: 'Saadiyat coastal', locationShort: 'Saad. C', corridor: 'Island coastal', coordinates: '24.538, 54.421', aqi: 78, no2: 62, pm25: 18, status: 'Moderate', weight: 90 },
]

const TARGET_ROWS = 1560

/** Deterministic PRNG so table + profile stay stable across reloads. */
function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function statusForAqi(aqi: number): AirQualityMapStation['status'] {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'USG'
  if (aqi <= 200) return 'Unhealthy'
  return 'Very Unhealthy'
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Observation window 2019–2026 with intentional sparse bands (gaps) for temporal profile.
 * Last-calibrated window 2021–2026 with a smaller gap.
 */
function pickObservationTime(rand: () => number): number {
  const start = Date.UTC(2019, 0, 1)
  const end = Date.UTC(2026, 0, 1)
  // Reject draws that land in gap bands so the timeline shows real holes
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const t = start + rand() * (end - start)
    const pos = (t - start) / (end - start)
    const inGap =
      (pos >= 0.42 && pos <= 0.47) ||
      (pos >= 0.58 && pos <= 0.595) ||
      (pos >= 0.62 && pos <= 0.632) ||
      (pos >= 0.88 && pos <= 0.89)
    if (!inGap) return t
  }
  return start + rand() * (end - start)
}

function pickCalibratedTime(rand: () => number, observationMs: number): number {
  const start = Date.UTC(2021, 0, 1)
  const end = Date.UTC(2026, 0, 1)
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const t = start + rand() * (end - start)
    const pos = (t - start) / (end - start)
    const inGap = (pos >= 0.18 && pos <= 0.21) || (pos >= 0.71 && pos <= 0.75)
    if (!inGap && t <= observationMs + 90 * 24 * 3600 * 1000) return Math.min(t, observationMs)
  }
  return Math.min(observationMs, end - 1)
}

function allocateRowCounts(): number[] {
  const totalWeight = AIR_QUALITY_MAP_STATIONS.reduce((sum, s) => sum + s.weight, 0)
  const raw = AIR_QUALITY_MAP_STATIONS.map((s) => (s.weight / totalWeight) * TARGET_ROWS)
  const counts = raw.map((n) => Math.max(1, Math.floor(n)))
  let remainder = TARGET_ROWS - counts.reduce((a, b) => a + b, 0)
  const order = raw
    .map((n, i) => ({ i, frac: n - Math.floor(n) }))
    .sort((a, b) => b.frac - a.frac)
  let cursor = 0
  while (remainder > 0) {
    counts[order[cursor % order.length]!.i]! += 1
    remainder -= 1
    cursor += 1
  }
  return counts
}

let cachedTable: { columns: string[]; rows: string[][] } | null = null

/** Full query-result / profiler source table (~1,560 rows × 10 columns). */
export function airQualityMapQueryTable(): { columns: string[]; rows: string[][] } {
  if (cachedTable) return cachedTable

  const rng = mulberry32(0xa4115eed)
  const counts = allocateRowCounts()
  const rows: string[][] = []

  AIR_QUALITY_MAP_STATIONS.forEach((station, stationIndex) => {
    const n = counts[stationIndex] ?? 1
    for (let i = 0; i < n; i += 1) {
      const observationMs = pickObservationTime(rng)
      const calibratedMs = pickCalibratedTime(rng, observationMs)
      const aqi = Math.round(clamp(station.aqi + (rng() - 0.45) * 36, 28, 214))
      const no2 = Math.round(clamp(station.no2 + (rng() - 0.4) * station.no2 * 0.35, 12, 512))
      const pm25 = Math.round(clamp(station.pm25 + (rng() - 0.4) * station.pm25 * 0.4, 4, 119))
      const status = statusForAqi(aqi)

      rows.push([
        station.id,
        station.location,
        station.coordinates,
        station.corridor,
        formatDate(observationMs),
        formatDate(calibratedMs),
        String(aqi),
        String(no2),
        String(pm25),
        AIR_QUALITY_MAP_STATUS_LABEL[status],
      ])
    }
  })

  // Stable chronological-ish order for the results table
  rows.sort((a, b) => (a[4] ?? '').localeCompare(b[4] ?? '') || (a[0] ?? '').localeCompare(b[0] ?? ''))

  cachedTable = {
    columns: [...AIR_QUALITY_MAP_COLUMNS],
    rows,
  }
  return cachedTable
}

export function airQualityMapQueryRows(): string[][] {
  return airQualityMapQueryTable().rows
}
