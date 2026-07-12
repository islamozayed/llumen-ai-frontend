import type { CreatedComponent, WidgetVariant } from './assistantReplyTypes'
import styles from './KpiWidgets.module.css'

function StatusBadge({
  label,
  tone = 'normal',
}: {
  label: string
  tone?: 'critical' | 'normal' | 'warning'
}) {
  const toneClass =
    tone === 'critical' ? styles.badgeCritical : tone === 'warning' ? styles.badgeWarning : styles.badgeNormal
  return <span className={`${styles.badge} ${toneClass}`}>{label}</span>
}

function AqiWidget() {
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Air Quality Index</p>
      <p className={styles.widgetValue}>121</p>
      <div className={styles.gaugeTrack} aria-hidden>
        <span className={styles.gaugeThumb} style={{ left: '72%' }} />
      </div>
      <StatusBadge label="Unhealthy for Sensitive Groups" tone="warning" />
    </div>
  )
}

function PollutantsWidget() {
  const items: { name: string; value: string; unit: string; tone: 'critical' | 'normal' }[] = [
    { name: 'O₃', value: '48', unit: 'µg', tone: 'normal' },
    { name: 'NO₂', value: '430', unit: 'µg', tone: 'critical' },
    { name: 'SO₂', value: '12', unit: 'µg', tone: 'normal' },
    { name: 'CO', value: '0.4', unit: 'mg', tone: 'normal' },
    { name: 'PM₁₀', value: '38', unit: 'µg', tone: 'normal' },
    { name: 'PM₂.₅', value: '70', unit: 'µg', tone: 'critical' },
    { name: 'NH₃', value: '9', unit: 'µg', tone: 'normal' },
    { name: 'VOC', value: '22', unit: 'µg', tone: 'normal' },
    { name: 'H₂S', value: '3', unit: 'µg', tone: 'critical' },
  ]

  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Pollutant Readings</p>
      <div className={styles.pollutantGrid}>
        {items.map((item) => (
          <div key={item.name} className={styles.pollutantCell}>
            <span className={styles.pollutantName}>{item.name}</span>
            <span className={styles.pollutantValue}>
              {item.value}
              <span className={styles.pollutantUnit}>{item.unit}</span>
            </span>
            <StatusBadge label={item.tone === 'critical' ? 'Critical' : 'Normal'} tone={item.tone} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PopulationWidget() {
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Population</p>
      <p className={styles.widgetValueSm}>2.5 million</p>
      <div className={styles.stackedBar} aria-hidden>
        <span className={styles.stackAdults} style={{ width: '68%' }} />
        <span className={styles.stackYouth} style={{ width: '22%' }} />
        <span className={styles.stackSeniors} style={{ width: '10%' }} />
      </div>
      <ul className={styles.legendList}>
        <li>
          <span className={`${styles.legendDot} ${styles.dotAdults}`} />
          Adults (20–59)
          <span className={styles.legendValue}>1.7M · 68%</span>
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotYouth}`} />
          Youth (0–19)
          <span className={styles.legendValue}>675K · 27%</span>
        </li>
        <li>
          <span className={`${styles.legendDot} ${styles.dotSeniors}`} />
          Seniors (60+)
          <span className={styles.legendValue}>125K · 5%</span>
        </li>
      </ul>
    </div>
  )
}

function LandUseWidget() {
  const rows = [
    { label: 'Industrial', pct: 42 },
    { label: 'Transport', pct: 28 },
    { label: 'Residential', pct: 18 },
    { label: 'Other', pct: 12 },
  ]
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Land-use Distribution</p>
      <div className={styles.barList}>
        {rows.map((row) => (
          <div key={row.label} className={styles.barRow}>
            <div className={styles.barLabelRow}>
              <span>{row.label}</span>
              <span>{row.pct}%</span>
            </div>
            <div className={styles.barTrack}>
              <span className={styles.barFill} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WindWidget() {
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Wind</p>
      <div className={styles.windDial} aria-hidden>
        <div className={styles.windNeedle} />
        <p className={styles.windValue}>NW</p>
        <p className={styles.windSub}>12 km/h</p>
      </div>
    </div>
  )
}

function HumidityWidget() {
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Avg. Humidity</p>
      <p className={styles.widgetValue}>64%</p>
      <div className={styles.sparkline} aria-hidden>
        <svg viewBox="0 0 172 48" preserveAspectRatio="none" className={styles.sparkSvg}>
          <defs>
            <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e0c27a" />
              <stop offset="100%" stopColor="#5ec4b0" />
            </linearGradient>
          </defs>
          <path
            d="M0 30 C20 28, 40 18, 60 22 S100 36, 120 20 S150 10, 172 16"
            fill="none"
            stroke="url(#sparkStroke)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  )
}

function OdorWidget() {
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>Odor Intensity</p>
      <p className={styles.widgetValue}>
        4.1<span className={styles.valueSuffix}>/5</span>
      </p>
      <div className={styles.gaugeTrack} aria-hidden>
        <span className={styles.gaugeThumb} style={{ left: '82%' }} />
      </div>
      <StatusBadge label="Critical" tone="critical" />
    </div>
  )
}

function ChartFallback({ title }: { title: string }) {
  return (
    <div className={styles.widgetInner}>
      <p className={styles.widgetTitle}>{title}</p>
      <div className={styles.sparkline} aria-hidden>
        <svg viewBox="0 0 172 64" preserveAspectRatio="none" className={styles.sparkSvg}>
          <path
            d="M0 50 L28 42 L56 46 L84 22 L112 30 L140 12 L172 18"
            fill="none"
            stroke="rgba(115,173,245,0.95)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  )
}

function renderVariant(variant: WidgetVariant, title: string) {
  switch (variant) {
    case 'aqi':
      return <AqiWidget />
    case 'pollutants':
      return <PollutantsWidget />
    case 'population':
      return <PopulationWidget />
    case 'land-use':
      return <LandUseWidget />
    case 'wind':
      return <WindWidget />
    case 'humidity':
      return <HumidityWidget />
    case 'odor':
      return <OdorWidget />
    case 'chart':
    case 'map':
    default:
      return <ChartFallback title={title} />
  }
}

export function KpiWidget({ component, compact = false }: { component: CreatedComponent; compact?: boolean }) {
  const preview = component.preview
  if (preview?.kind !== 'widget') {
    return (
      <div className={`${styles.root} ${compact ? styles.rootCompact : styles.rootFull}`}>
        <ChartFallback title={component.title} />
      </div>
    )
  }

  return (
    <div
      className={`${styles.root} ${compact || component.inlineSize === 'square' ? styles.rootCompact : styles.rootFull}`}
    >
      {renderVariant(preview.variant, component.title)}
    </div>
  )
}
