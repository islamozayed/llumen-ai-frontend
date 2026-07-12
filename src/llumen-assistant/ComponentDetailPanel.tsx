import { useEffect, useRef, useState, type RefObject } from 'react'
import { ArrowsInSimple, Info } from '@phosphor-icons/react'
import type { CreatedComponent } from './assistantReplyTypes'
import { DataSourceSettingsPanel } from './DataSourceSettingsPanel'
import { getDataSourceConfig } from './dataSourceSettingsDemo'
import { InteractiveMap, MapControls, type InteractiveMapHandle } from './InteractiveMap'
import { KpiWidget } from './KpiWidgets'
import styles from './compact-assistant.module.css'

export type ComponentDetailPanelProps = {
  component: CreatedComponent
  onClose: () => void
}

type DetailTab = 'component' | 'query-results' | 'data-source'

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'component', label: 'Component' },
  { id: 'query-results', label: 'Query Results' },
  { id: 'data-source', label: 'Data Source' },
]

function isMapDetailComponent(component: CreatedComponent) {
  return component.preview?.kind === 'image' && component.preview.detailView === 'map'
}

function ComponentPreview({ component }: { component: CreatedComponent }) {
  const { preview, title } = component

  if (isMapDetailComponent(component)) {
    return <InteractiveMap className={styles.componentDetailInteractiveMap} />
  }

  if (preview?.kind === 'widget') {
    return <KpiWidget component={component} />
  }

  if (preview?.kind === 'image') {
    return (
      <img
        className={
          preview.fit === 'cover'
            ? styles.componentDetailPreviewImageCover
            : styles.componentDetailPreviewImage
        }
        src={preview.src}
        alt={preview.alt ?? title}
      />
    )
  }

  if (preview?.kind === 'kpi') {
    return (
      <p className={styles.componentDetailKpi}>
        {preview.value}
        {preview.unit ? <span className={styles.componentDetailKpiUnit}>{preview.unit}</span> : null}
      </p>
    )
  }

  if (preview?.kind === 'text') {
    return <p className={styles.componentDetailText}>{preview.content}</p>
  }

  return <p className={styles.componentDetailTextMuted}>Preview not available for this component.</p>
}

function DetailMetaTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <table className={styles.componentDetailTable}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TabPanelContent({ tab, component }: { tab: DetailTab; component: CreatedComponent }) {
  if (tab === 'component') {
    return <ComponentPreview component={component} />
  }

  if (tab === 'query-results') {
    return (
      <pre className={`${styles.componentDetailCode} ${styles.componentDetailCodeFull}`}>{`SELECT
  station_id,
  aqi,
  no2_ugm3,
  pm25_ugm3
FROM env.semantic.air_quality_stations
WHERE observation_date = CURRENT_DATE
  AND aqi >= 100
ORDER BY aqi DESC
LIMIT 12;`}</pre>
    )
  }

  if (getDataSourceConfig(component)) {
    return <DataSourceSettingsPanel component={component} />
  }

  return (
    <DetailMetaTable
      rows={[
        { label: 'Semantic model', value: 'air_quality_monitoring' },
        { label: 'Primary table', value: 'air_quality_stations' },
        { label: 'Connection', value: 'EAD Environmental Warehouse' },
        { label: 'Last synced', value: 'Today · live' },
      ]}
    />
  )
}

function MapDescriptionPopover({
  open,
  title,
  caption,
  analysis,
  onClose,
  anchorRef,
}: {
  open: boolean
  title: string
  caption?: string
  analysis?: string
  onClose: () => void
  anchorRef: RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      id="map-description-popover"
      className={styles.mapDescriptionPopover}
      role="dialog"
      aria-label={`${title} description`}
    >
      {caption ? <p className={styles.mapDescriptionCaption}>{caption}</p> : null}
      {analysis ? <p className={styles.mapDescriptionAnalysis}>{analysis}</p> : null}
      {!caption && !analysis ? (
        <p className={styles.mapDescriptionAnalysis}>No description available for this map.</p>
      ) : null}
    </div>
  )
}

export function ComponentDetailPanel({ component, onClose }: ComponentDetailPanelProps) {
  const { title, description, caption, analysis } = component
  const [activeTab, setActiveTab] = useState<DetailTab>('component')
  const [descOpen, setDescOpen] = useState(false)
  const descBtnRef = useRef<HTMLButtonElement>(null)
  const mapRef = useRef<InteractiveMapHandle>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [controlsTop, setControlsTop] = useState(160)
  const chartCaption = caption ?? description
  const chartAnalysis = analysis
  const isMap = isMapDetailComponent(component)

  useEffect(() => {
    setActiveTab('component')
    setDescOpen(false)
  }, [component.id])

  useEffect(() => {
    if (!isMap) return
    const el = headerRef.current
    if (!el) return

    const measure = () => {
      const tabs = el.querySelector('[role="tablist"]') as HTMLElement | null
      if (tabs) {
        const headerTop = el.getBoundingClientRect().top
        const tabsBottom = tabs.getBoundingClientRect().bottom
        setControlsTop(Math.max(12, Math.round(tabsBottom - headerTop + 12)))
        return
      }
      setControlsTop(Math.round(el.getBoundingClientRect().height - 48))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMap, activeTab, descOpen])

  if (isMap) {
    return (
      <aside className={`${styles.componentDetail} ${styles.componentDetailMapBleed}`} aria-label={`${title} preview`}>
        <div className={styles.mapBleedStage}>
          <InteractiveMap
            ref={mapRef}
            className={styles.componentDetailInteractiveMap}
            showControls={false}
          />
        </div>

          <div ref={headerRef} className={styles.mapBleedHeader}>
          <div className={styles.mapBleedBlur} aria-hidden />
          <div className={`${styles.mapBleedHeaderInner}${descOpen ? ` ${styles.mapBleedHeaderInnerRaised}` : ''}`}>
            <div className={styles.mapBleedHeaderText}>
              <h2 className={styles.mapBleedTitle}>{title}</h2>
              <div className={styles.mapBleedDescWrap}>
                <button
                  ref={descBtnRef}
                  type="button"
                  className={styles.mapBleedDescBtn}
                  aria-expanded={descOpen}
                  aria-controls="map-description-popover"
                  onClick={() => setDescOpen((v) => !v)}
                >
                  <Info size={18} weight="regular" aria-hidden />
                  View description
                </button>
                <MapDescriptionPopover
                  open={descOpen}
                  title={title}
                  caption={chartCaption}
                  analysis={chartAnalysis}
                  onClose={() => setDescOpen(false)}
                  anchorRef={descBtnRef}
                />
              </div>
            </div>
            <button
              type="button"
              className={styles.componentDetailClose}
              onClick={onClose}
              aria-label="Collapse preview"
            >
              <ArrowsInSimple size={20} weight="regular" aria-hidden />
            </button>
          </div>

          <div className={styles.mapBleedTabs} role="tablist" aria-label="Component detail views">
            {DETAIL_TABS.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`component-detail-tab-${tab.id}`}
                  className={`${styles.componentDetailTab}${selected ? ` ${styles.componentDetailTabActive}` : ''}`}
                  aria-selected={selected}
                  aria-controls={`component-detail-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'component' ? (
          <MapControls
            className={styles.mapBleedControls}
            style={{ top: controlsTop }}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onResetNorth={() => mapRef.current?.resetNorth()}
          />
        ) : null}

        {activeTab !== 'component' ? (
          <div
            className={styles.mapBleedSecondary}
            role="tabpanel"
            id={`component-detail-panel-${activeTab}`}
            aria-labelledby={`component-detail-tab-${activeTab}`}
          >
            <TabPanelContent tab={activeTab} component={component} />
          </div>
        ) : null}
      </aside>
    )
  }

  return (
    <aside className={styles.componentDetail} aria-label={`${title} preview`}>
      <div className={styles.componentDetailHeader}>
        <div className={styles.componentDetailHeaderText}>
          <h2 className={styles.componentDetailTitle}>{title}</h2>
          {chartCaption ? <p className={styles.componentDetailCaption}>{chartCaption}</p> : null}
          {chartAnalysis ? <p className={styles.componentDetailAnalysis}>{chartAnalysis}</p> : null}
        </div>
        <button
          type="button"
          className={styles.componentDetailClose}
          onClick={onClose}
          aria-label="Collapse preview"
        >
          <ArrowsInSimple size={20} weight="regular" aria-hidden />
        </button>
      </div>

      <div className={styles.componentDetailTabs} role="tablist" aria-label="Component detail views">
        {DETAIL_TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`component-detail-tab-${tab.id}`}
              className={`${styles.componentDetailTab}${selected ? ` ${styles.componentDetailTabActive}` : ''}`}
              aria-selected={selected}
              aria-controls={`component-detail-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        className={`${styles.componentDetailBody}${
          activeTab === 'query-results' || activeTab === 'data-source'
            ? ` ${styles.componentDetailBodyConstrained}`
            : ''
        }`}
        role="tabpanel"
        id={`component-detail-panel-${activeTab}`}
        aria-labelledby={`component-detail-tab-${activeTab}`}
      >
        <div
          className={`${styles.componentDetailStage}${
            activeTab === 'query-results' || (activeTab === 'data-source' && getDataSourceConfig(component))
              ? ` ${styles.componentDetailStageWide}`
              : ''
          }`}
        >
          <TabPanelContent tab={activeTab} component={component} />
        </div>
      </div>
    </aside>
  )
}
