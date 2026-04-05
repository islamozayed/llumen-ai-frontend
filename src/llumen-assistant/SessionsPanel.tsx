import { useCallback } from 'react'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'
import { FolderPlus, PlusCircle } from '@phosphor-icons/react'
import styles from './SessionsPanel.module.css'

export type SessionSummary = {
  id: string
  title: string
  updatedLabel: string
  preview: string
}

const MOCK_SESSIONS: SessionSummary[] = [
  {
    id: '1',
    title: 'Marina logistics brief',
    updatedLabel: 'Today · 2:14 PM',
    preview: 'Affirmative. A demo response stream. • Location: Dubai Marina…',
  },
  {
    id: '2',
    title: 'Weekly ops recap',
    updatedLabel: 'Yesterday',
    preview: 'Summary of throughput, exceptions, and SLA notes for stakeholders.',
  },
  {
    id: '3',
    title: 'Onboarding — design system',
    updatedLabel: 'Mar 28',
    preview: 'Token naming, component inventory, and Figma library links.',
  },
]

export type SessionsPanelProps = {
  onOpenSession: (id: string) => void
  onNewSession: () => void
  onNewProject: () => void
}

export function SessionsPanel({ onOpenSession, onNewSession, onNewProject }: SessionsPanelProps) {
  const scrollRef = useRevealScrollbarOnScroll()
  const open = useCallback(
    (id: string) => {
      onOpenSession(id)
    },
    [onOpenSession],
  )

  return (
    <div className={styles.root}>
      <div ref={scrollRef} className={styles.scroll}>
        <h2 className={styles.heading}>Sessions</h2>
        <p className={styles.subtitle}>
          Open a recent conversation or start something new. Projects group related sessions.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={onNewSession}>
            <PlusCircle size={18} weight="duotone" aria-hidden />
            New session
          </button>
          <button type="button" className={styles.actionBtn} onClick={onNewProject}>
            <FolderPlus size={18} weight="duotone" aria-hidden />
            New project
          </button>
        </div>

        <h3 className={styles.sectionLabel}>Recent</h3>

        {MOCK_SESSIONS.length === 0 ? (
          <p className={styles.empty}>No sessions yet. Start a new one above.</p>
        ) : (
          <ul className={styles.list}>
            {MOCK_SESSIONS.map((s) => (
              <li key={s.id}>
                <button type="button" className={styles.sessionRow} onClick={() => open(s.id)}>
                  <div className={styles.sessionBody}>
                    <div className={styles.sessionTitleRow}>
                      <p className={styles.sessionTitle}>{s.title}</p>
                      <p className={styles.sessionMeta}>{s.updatedLabel}</p>
                    </div>
                    <p className={styles.sessionPreview}>{s.preview}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
