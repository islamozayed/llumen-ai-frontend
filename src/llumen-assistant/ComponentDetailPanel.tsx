import { useEffect, useState } from 'react'
import { ArrowsInSimple } from '@phosphor-icons/react'
import type { CreatedComponent } from './assistantReplyTypes'
import { VisualizationSettingsPanel } from './VisualizationSettingsPanel'
import { DataSourceSettingsPanel } from './DataSourceSettingsPanel'
import { getDataSourceConfig } from './dataSourceSettingsDemo'
import styles from './compact-assistant.module.css'

export type ComponentDetailPanelProps = {
  component: CreatedComponent
  onClose: () => void
}

type DetailTab = 'component' | 'query-results' | 'data-source' | 'visualization'

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'component', label: 'Component' },
  { id: 'query-results', label: 'Query Results' },
  { id: 'data-source', label: 'Data Source' },
  { id: 'visualization', label: 'Visualization & Mapping' },
]

function isMapDetailComponent(component: CreatedComponent) {
  return component.preview?.kind === 'image' && component.preview.detailView === 'map'
}

function mapDetailImageSrc(component: CreatedComponent) {
  const preview = component.preview
  if (preview?.kind !== 'image') return ''
  return preview.detailSrc ?? preview.src
}

function MapDetailPanel({ component, onClose }: ComponentDetailPanelProps) {
  const { title } = component

  return (
    <aside className={`${styles.componentDetail} ${styles.componentDetailMap}`} aria-label={`${title} map`}>
      <div className={styles.componentDetailMapStage}>
        <img
          className={styles.componentDetailMapImage}
          src={mapDetailImageSrc(component)}
          alt={component.preview?.kind === 'image' ? (component.preview.alt ?? title) : title}
        />
      </div>
      <div className={styles.componentDetailMapHeader}>
        <h2 className={styles.componentDetailMapTitle}>{title}</h2>
        <button
          type="button"
          className={styles.componentDetailClose}
          onClick={onClose}
          aria-label="Collapse preview"
        >
          <ArrowsInSimple size={20} weight="regular" aria-hidden />
        </button>
      </div>
    </aside>
  )
}

function ComponentPreview({ component }: { component: CreatedComponent }) {
  const { preview, title } = component

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
  district_id,
  SUM(net_sales_aed) AS demand_aed
FROM retail.semantic.district_demand
WHERE quarter = '2026-Q1'
  AND heat_cohort = 'high'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 12;`}</pre>
    )
  }

  if (tab === 'data-source') {
    if (getDataSourceConfig(component)) {
      return <DataSourceSettingsPanel component={component} />
    }

    return (
      <DetailMetaTable
        rows={[
          { label: 'Semantic model', value: 'retail_demand' },
          { label: 'Primary table', value: 'district_demand' },
          { label: 'Connection', value: 'UAE Retail Warehouse' },
          { label: 'Last synced', value: 'Today · 2:14 PM' },
        ]}
      />
    )
  }

  return <VisualizationSettingsPanel component={component} />
}

function StandardDetailPanel({ component, onClose }: ComponentDetailPanelProps) {
  const { title, description } = component
  const [activeTab, setActiveTab] = useState<DetailTab>('component')

  useEffect(() => {
    setActiveTab('component')
  }, [component.id])

  return (
    <aside className={styles.componentDetail} aria-label={`${title} preview`}>
      <div className={styles.componentDetailHeader}>
        <div className={styles.componentDetailHeaderText}>
          <h2 className={styles.componentDetailTitle}>{title}</h2>
          <p className={styles.componentDetailDescription}>{description}</p>
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
          activeTab === 'visualization' || activeTab === 'query-results' || activeTab === 'data-source'
            ? ` ${styles.componentDetailBodyConstrained}`
            : ''
        }`}
        role="tabpanel"
        id={`component-detail-panel-${activeTab}`}
        aria-labelledby={`component-detail-tab-${activeTab}`}
      >
        <div
          className={`${styles.componentDetailStage}${
            activeTab === 'visualization' ||
            activeTab === 'query-results' ||
            (activeTab === 'data-source' && getDataSourceConfig(component))
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

export function ComponentDetailPanel({ component, onClose }: ComponentDetailPanelProps) {
  if (isMapDetailComponent(component)) {
    return <MapDetailPanel component={component} onClose={onClose} />
  }

  return <StandardDetailPanel component={component} onClose={onClose} />
}
