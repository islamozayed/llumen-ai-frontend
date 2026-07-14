import { useState, type ReactNode } from 'react'
import { Diamond, GridFour } from '@phosphor-icons/react'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'
import styles from './DataSourceSettingsPanel.module.css'

type RequestTab = 'Parameters' | 'Authentication' | 'Headers' | 'Body' | 'Scripts'

type QueryParam = {
  key: string
  value: string
}

const REQUEST_TABS: RequestTab[] = ['Parameters', 'Authentication', 'Headers', 'Body', 'Scripts']

const DEMO_METHOD = 'GET'
const DEMO_URL =
  'https://weather.secureclient.com/api/v1/current?location=New York&units=metric'
const DEMO_PARAMS: QueryParam[] = [
  { key: 'location', value: 'New York' },
  { key: 'units', value: 'metric' },
]

function SourceCard({
  label,
  icon,
  iconTone,
  title,
  subtitle,
}: {
  label: string
  icon: ReactNode
  iconTone: 'api' | 'request'
  title: string
  subtitle?: string
}) {
  return (
    <section className={styles.block}>
      <h4 className={styles.blockLabel}>{label}</h4>
      <div className={styles.sourceCard}>
        <div className={styles.sourceCardMain}>
          <span
            className={`${styles.sourceCardIcon} ${
              iconTone === 'api' ? styles.sourceCardIconApi : styles.sourceCardIconRequest
            }`}
          >
            {icon}
          </span>
          <div className={styles.sourceCardText}>
            <span className={styles.sourceCardTitle}>{title}</span>
            {subtitle ? <span className={styles.sourceCardSubtitle}>{subtitle}</span> : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function QueryParamRow({ row }: { row: QueryParam }) {
  return (
    <div className={styles.paramRow}>
      <span className={styles.paramCell}>{row.key}</span>
      <span className={styles.paramCell}>{row.value}</span>
    </div>
  )
}

export function DataSourceSettingsPanel() {
  const [requestTab, setRequestTab] = useState<RequestTab>('Parameters')
  const scrollRef = useRevealScrollbarOnScroll()

  return (
    <div className={styles.root}>
      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.step}>
          <SourceCard
            label="Selected Data Source Type"
            iconTone="api"
            icon={<Diamond size={20} weight="fill" aria-hidden />}
            title="API"
          />

          <SourceCard
            label="API Request"
            iconTone="request"
            icon={<GridFour size={20} weight="fill" aria-hidden />}
            title="Get Current Weather"
            subtitle="Collection: Weather Services"
          />

          <div className={styles.urlBar}>
            <span className={styles.method} aria-label="HTTP method">
              {DEMO_METHOD}
            </span>
            <span className={styles.urlValue} title={DEMO_URL}>
              {DEMO_URL}
            </span>
          </div>

          <section className={styles.request}>
            <h3 className={styles.requestTitle}>Request</h3>
            <div className={styles.requestTabs} role="tablist" aria-label="Request configuration">
              {REQUEST_TABS.map((tab) => {
                const active = requestTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`${styles.requestTab}${active ? ` ${styles.requestTabActive}` : ''}`}
                    onClick={() => setRequestTab(tab)}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            {requestTab === 'Parameters' ? (
              <div className={styles.requestPanel}>
                <section className={styles.block}>
                  <h4 className={styles.blockLabel}>Query Params</h4>
                  <div className={styles.paramTable}>
                    <div className={styles.paramTableHead}>
                      <span>Key</span>
                      <span>Value</span>
                    </div>
                    {DEMO_PARAMS.map((row) => (
                      <QueryParamRow key={row.key} row={row} />
                    ))}
                  </div>
                </section>

                <section className={styles.block}>
                  <h4 className={styles.blockLabel}>Path Variables</h4>
                  <div className={styles.paramTable}>
                    <div className={`${styles.paramRow} ${styles.paramRowPair}`}>
                      <span className={`${styles.paramCell} ${styles.paramCellMuted}`}>Key</span>
                      <span className={`${styles.paramCell} ${styles.paramCellMuted}`}>Value</span>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className={`${styles.requestPanel} ${styles.requestPanelPlaceholder}`}>
                <p>{requestTab} configuration is not available in this preview.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
