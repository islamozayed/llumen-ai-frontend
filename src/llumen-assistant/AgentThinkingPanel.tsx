import {
  Content as AccordionContent,
  Header as AccordionHeader,
  Item as AccordionItem,
  Root as AccordionRoot,
  Trigger as AccordionTrigger,
} from '@radix-ui/react-accordion'
import {
  Root as ScrollAreaRoot,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
  Viewport as ScrollAreaViewport,
} from '@radix-ui/react-scroll-area'
import { CaretDown, CheckCircle, Hourglass } from '@phosphor-icons/react'
import styles from './AgentThinkingPanel.module.css'

export type AgentActivityItem = {
  id: string
  label: string
  status: 'complete' | 'active' | 'pending'
  /** Indentation level for nested status lines */
  depth?: number
  /** Visual emphasis for sub-steps (e.g. italic highlight) */
  tone?: 'default' | 'muted' | 'highlight'
}

export type AgentThinkingPanelProps = {
  activities: AgentActivityItem[]
  planSummary: string
  planBody: string
  /** Final assistant reply shown below the plan when present */
  replyText?: string
  className?: string
}

export function AgentThinkingPanel({
  activities,
  planSummary,
  planBody,
  replyText,
  className,
}: AgentThinkingPanelProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <AccordionRoot
        type="single"
        defaultValue="activity"
        collapsible
        className={styles.accordionRoot}
      >
        <AccordionItem value="activity" className={styles.accordionItem}>
          <AccordionHeader className={styles.accordionHeader}>
            <AccordionTrigger className={styles.activityTrigger}>
              <CaretDown className={styles.activityChevron} aria-hidden weight="fill" size={12} />
              <span className={styles.activityTitle}>Agent activity</span>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent className={styles.activityContent}>
            <ul className={styles.activityList}>
              {activities.map((row) => (
                <li
                  key={row.id}
                  className={styles.activityRow}
                  style={{ paddingLeft: 8 + (row.depth ?? 0) * 14 }}
                  data-tone={row.tone ?? 'default'}
                  data-status={row.status}
                >
                  <span className={styles.activityIcon} aria-hidden>
                    {row.status === 'complete' ? (
                      <CheckCircle className={styles.iconComplete} weight="fill" size={16} />
                    ) : (
                      <Hourglass className={styles.iconActive} weight="regular" size={16} />
                    )}
                  </span>
                  <span className={styles.activityLabel}>{row.label}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>

      <div className={styles.planShell}>
        <ScrollAreaRoot className={styles.planScrollRoot} type="scroll">
          <ScrollAreaViewport className={styles.planViewport}>
            <div className={styles.planInner}>
              <p className={styles.planSummaryLabel}>Plan summary</p>
              <p className={styles.planSummaryText}>{planSummary}</p>
              <p className={styles.planDetailLabel}>Plan</p>
              <pre className={styles.planBody}>{planBody}</pre>
              {replyText ? <div className={styles.replyStream}>{replyText}</div> : null}
            </div>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar className={styles.scrollbar} orientation="vertical">
            <ScrollAreaThumb className={styles.scrollThumb} />
          </ScrollAreaScrollbar>
        </ScrollAreaRoot>
      </div>
    </div>
  )
}
