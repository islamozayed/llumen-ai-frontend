import { useEffect, useId, useState, type CSSProperties, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { CreatedComponent } from './assistantReplyTypes'
import {
  dataProfileForComponent,
  type ColumnProfile,
  type SpatialAvailabilitySeries,
  type TemporalAvailabilitySeries,
} from './componentDataProfiles'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'
import styles from './DataProfilePanel.module.css'

const TOOLTIP_OFFSET = 14

function Metric({ label, value }: { label: string; value: string }) {
  const isEmpty = value === '—' || value === '-'
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue}${isEmpty ? ` ${styles.metricValueEmpty}` : ''}`}>
        {value}
      </span>
    </div>
  )
}

function formatUtcMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Interpolate a missing-data range from the series bounds and gap fractions. */
function formatTemporalGapRange(
  startLabel: string,
  endLabel: string,
  start: number,
  width: number,
): string {
  const startYear = Number(startLabel)
  const endYear = Number(endLabel)
  if (/^\d{4}$/.test(startLabel) && /^\d{4}$/.test(endLabel) && endYear > startYear) {
    const rangeStart = Date.UTC(startYear, 0, 1)
    const rangeEnd = Date.UTC(endYear, 0, 1)
    const total = rangeEnd - rangeStart
    const gapStart = new Date(rangeStart + start * total)
    const gapEnd = new Date(rangeStart + (start + width) * total)
    return `${formatUtcMonthYear(gapStart)} – ${formatUtcMonthYear(gapEnd)}`
  }

  const fromPct = Math.round(start * 100)
  const toPct = Math.round((start + width) * 100)
  return `${startLabel} → ${endLabel} · ${fromPct}%–${toPct}%`
}

function TimelineGap({
  startLabel,
  endLabel,
  start,
  width,
}: {
  startLabel: string
  endLabel: string
  start: number
  width: number
}) {
  const tooltipId = useId()
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const rangeLabel = formatTemporalGapRange(startLabel, endLabel, start, width)
  const tooltipText = `Missing data · ${rangeLabel}`

  const placeTooltip = (clientX: number, clientY: number) => {
    const pad = 12
    const approxWidth = 240
    const approxHeight = 40
    const x = Math.min(clientX + TOOLTIP_OFFSET, window.innerWidth - approxWidth - pad)
    const y = Math.min(clientY + TOOLTIP_OFFSET, window.innerHeight - approxHeight - pad)
    setTooltipPos({
      x: Math.max(pad, x),
      y: Math.max(pad, y),
    })
  }

  const onMove = (event: MouseEvent<HTMLButtonElement>) => {
    placeTooltip(event.clientX, event.clientY)
  }

  const onFocus = (event: FocusEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    placeTooltip(rect.left + rect.width / 2, rect.top)
  }

  return (
    <>
      <button
        type="button"
        className={styles.timelineGap}
        style={{ left: `${start * 100}%`, width: `${width * 100}%` }}
        aria-label={tooltipText}
        aria-describedby={tooltipPos ? tooltipId : undefined}
        onMouseEnter={onMove}
        onMouseMove={onMove}
        onMouseLeave={() => setTooltipPos(null)}
        onFocus={onFocus}
        onBlur={() => setTooltipPos(null)}
      />
      {tooltipPos
        ? createPortal(
            <div
              id={tooltipId}
              className={styles.tooltip}
              role="tooltip"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <p className={styles.tooltipText}>{tooltipText}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function ChartBar({
  label,
  count,
  height,
  index,
}: {
  label: string
  count: number
  height: number
  index: number
}) {
  const tooltipId = useId()
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const tooltipText = `${label || `Bin ${index + 1}`} · ${count.toLocaleString('en-US')}`

  const placeTooltip = (clientX: number, clientY: number) => {
    const pad = 12
    const approxWidth = 220
    const approxHeight = 40
    const x = Math.min(clientX + TOOLTIP_OFFSET, window.innerWidth - approxWidth - pad)
    const y = Math.min(clientY + TOOLTIP_OFFSET, window.innerHeight - approxHeight - pad)
    setTooltipPos({
      x: Math.max(pad, x),
      y: Math.max(pad, y),
    })
  }

  return (
    <>
      <button
        type="button"
        className={styles.chartBarTrack}
        aria-label={tooltipText}
        aria-describedby={tooltipPos ? tooltipId : undefined}
        onMouseEnter={(event) => placeTooltip(event.clientX, event.clientY)}
        onMouseMove={(event) => placeTooltip(event.clientX, event.clientY)}
        onMouseLeave={() => setTooltipPos(null)}
        onFocus={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          placeTooltip(rect.left + rect.width / 2, rect.top)
        }}
        onBlur={() => setTooltipPos(null)}
      >
        <span className={styles.chartBar} style={{ height: `${Math.round(height * 100)}%` }} />
      </button>
      {tooltipPos
        ? createPortal(
            <div
              id={tooltipId}
              className={styles.tooltip}
              role="tooltip"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <p className={styles.tooltipText}>{tooltipText}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function DistributionChart({ column }: { column: ColumnProfile }) {
  const distribution = column.distribution
  if (!distribution || distribution.bars.length === 0) return null

  const binCount = Math.max(distribution.bars.length, distribution.xLabels.length)
  const sparseLabels = binCount > 7
  const midIndex = Math.floor((binCount - 1) / 2)
  const binStyle = {
    '--chart-bins': binCount,
    '--chart-bar-radius': sparseLabels ? '2px' : 'var(--radius-xs)',
  } as CSSProperties

  return (
    <div className={styles.chart}>
      <div className={styles.chartPlot}>
        <span className={styles.chartYLabel} aria-hidden>
          {distribution.yMaxLabel}
        </span>
        <div className={styles.chartBars} style={binStyle}>
          {distribution.bars.map((height, index) => (
            <ChartBar
              key={`${column.name}-bar-${index}`}
              label={distribution.xLabels[index] ?? ''}
              count={distribution.counts[index] ?? 0}
              height={height}
              index={index}
            />
          ))}
        </div>
        <div className={styles.chartAxisY} aria-hidden />
        <div className={styles.chartAxisX} aria-hidden />
      </div>
      <div className={styles.chartXLabels} style={binStyle} aria-hidden>
        {Array.from({ length: binCount }, (_, index) => {
          const label = distribution.xLabels[index] ?? ''
          const show =
            !sparseLabels || index === 0 || index === midIndex || index === binCount - 1
          return (
            <span key={`${column.name}-x-${index}`} className={show ? undefined : styles.chartXLabelHidden}>
              {show ? label : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function ColumnProfileCard({ column }: { column: ColumnProfile }) {
  return (
    <article className={styles.columnCard}>
      <header className={styles.columnHeader}>
        <h4 className={styles.columnName}>{column.name}</h4>
        <span className={styles.typeBadge}>{column.dataType}</span>
      </header>

      <div className={styles.metricRow}>
        <Metric label="Count" value={column.count} />
        <Metric label="Missing" value={column.missing} />
        <Metric label="Zeroes" value={column.zeroes} />
      </div>

      <div className={styles.metricRow}>
        <Metric label="Min" value={column.min} />
        <Metric label="Max" value={column.max} />
        <Metric label="Median" value={column.median} />
      </div>

      <DistributionChart column={column} />
    </article>
  )
}

function SeriesTabs({
  label,
  series,
  activeId,
  onChange,
}: {
  label: string
  series: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}) {
  if (series.length <= 1) return null

  return (
    <div className={styles.seriesTabs} role="tablist" aria-label={label}>
      {series.map((item) => {
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.seriesTab}${active ? ` ${styles.seriesTabActive}` : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function TemporalAvailability({ series }: { series: TemporalAvailabilitySeries[] }) {
  const seriesKey = series.map((item) => item.id).join('|')
  const firstId = series[0]?.id ?? ''
  const [activeId, setActiveId] = useState(firstId)
  const active = series.find((item) => item.id === activeId) ?? series[0]

  useEffect(() => {
    setActiveId(firstId)
  }, [seriesKey, firstId])

  if (!active) return null

  return (
    <section className={styles.availabilitySection}>
      <div className={styles.availabilityHeader}>
        <h3 className={styles.sectionTitle}>Temporal availability</h3>
        <SeriesTabs
          label="Temporal columns"
          series={series}
          activeId={active.id}
          onChange={setActiveId}
        />
      </div>
      <div className={styles.timelineTrack}>
        <div className={styles.timelineFill} aria-hidden />
        {active.gaps.map((gap, index) => (
          <TimelineGap
            key={`${active.id}-gap-${index}`}
            startLabel={active.startLabel}
            endLabel={active.endLabel}
            start={gap.start}
            width={gap.width}
          />
        ))}
      </div>
      <div className={styles.timelineLabels}>
        <span>{active.startLabel}</span>
        <span>{active.endLabel}</span>
      </div>
    </section>
  )
}

function SpatialAvailability({ series }: { series: SpatialAvailabilitySeries[] }) {
  const seriesKey = series.map((item) => item.id).join('|')
  const firstId = series[0]?.id ?? ''
  const [activeId, setActiveId] = useState(firstId)
  const active = series.find((item) => item.id === activeId) ?? series[0]

  useEffect(() => {
    setActiveId(firstId)
  }, [seriesKey, firstId])

  if (!active) return null

  return (
    <section className={styles.availabilitySection}>
      <div className={styles.availabilityHeader}>
        <h3 className={styles.sectionTitle}>Spatial Availability</h3>
        <SeriesTabs
          label="Spatial columns"
          series={series}
          activeId={active.id}
          onChange={setActiveId}
        />
      </div>
      <div className={styles.spatialMap}>
        <img src={active.mapSrc} alt={active.mapAlt} />
      </div>
    </section>
  )
}

export function DataProfilePanel({ component }: { component: CreatedComponent }) {
  const profile = dataProfileForComponent(component)
  const scrollRef = useRevealScrollbarOnScroll()

  return (
    <div className={styles.root}>
      <div ref={scrollRef} className={styles.scroll}>
        <section className={styles.overviewSection} aria-label="Dataset overview">
          <h3 className={styles.sectionTitle}>Overview</h3>
          <div className={styles.overview}>
            <Metric label="Rows" value={profile.overview.rows} />
            <Metric label="Columns" value={profile.overview.columns} />
            <Metric label="Completeness" value={profile.overview.completeness} />
            <Metric label="Numeric" value={profile.overview.numericColumns} />
          </div>
        </section>

        <section className={styles.columnsSection} aria-label="Column profiles">
          <h3 className={styles.sectionTitle}>Data Columns</h3>
          <div className={styles.columnGrid}>
            {profile.columns.map((column) => (
              <ColumnProfileCard key={column.name} column={column} />
            ))}
          </div>
        </section>

        <TemporalAvailability series={profile.temporal} />
        <SpatialAvailability series={profile.spatial} />
      </div>
    </div>
  )
}
