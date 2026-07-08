import { useEffect, useState } from 'react'
import type { CreatedComponent } from './assistantReplyTypes'
import {
  getDataSourceConfig,
  type DataSourceSectionId,
  type DataSourceStaticField,
  type DataSourceStaticSection,
} from './dataSourceSettingsDemo'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'
import styles from './VisualizationSettingsPanel.module.css'

function StaticValueField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

function StaticDescriptionField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <p className={styles.fieldDescription}>{value}</p>
    </div>
  )
}

function StaticToggleField({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={`${styles.toggleBadge}${enabled ? ` ${styles.toggleBadgeOn}` : ''}`}>
        {enabled ? 'On' : 'Off'}
      </span>
    </div>
  )
}

function renderField(field: DataSourceStaticField) {
  if (field.kind === 'value') {
    return <StaticValueField key={field.label} label={field.label} value={field.value} />
  }
  if (field.kind === 'description') {
    return <StaticDescriptionField key={field.label} label={field.label} value={field.value} />
  }
  return <StaticToggleField key={field.label} label={field.label} enabled={field.enabled} />
}

function SettingsSection({ section }: { section: DataSourceStaticSection }) {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.settingsSectionHeader}>
        <h4 className={styles.settingsSectionTitle}>{section.title}</h4>
      </div>
      <div className={styles.settingsSectionBody}>{section.fields.map(renderField)}</div>
    </section>
  )
}

export function DataSourceSettingsPanel({ component }: { component: CreatedComponent }) {
  const config = getDataSourceConfig(component)
  const [activeSection, setActiveSection] = useState<DataSourceSectionId>('basic')
  const sectionScrollRef = useRevealScrollbarOnScroll()

  useEffect(() => {
    setActiveSection('basic')
  }, [component.id])

  if (!config) return null

  const activeSections = config.sections[activeSection] ?? []

  return (
    <div className={styles.root}>
      <div className={styles.visualTypeCard}>
        <div className={styles.visualTypeMain}>
          <span>{config.sourceName}</span>
        </div>
        <span className={styles.sourceTypeMeta}>{config.sourceType}</span>
      </div>

      <div className={styles.settingsShell}>
        <p className={styles.settingsHeading}>Data Source Settings</p>

        <div className={styles.settingsLayout}>
          <nav className={styles.sectionNav} aria-label="Data source sections">
            {config.nav.map((item) => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.sectionNavBtn}${active ? ` ${styles.sectionNavBtnActive}` : ''}`}
                  onClick={() => setActiveSection(item.id)}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div ref={sectionScrollRef} className={styles.sectionContent}>
            {activeSections.map((section) => (
              <SettingsSection key={section.title} section={section} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
