import { useCallback, useEffect, useRef, useState } from 'react'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'
import { ArrowLeft, DotsThreeVertical, Gear, Plus } from '@phosphor-icons/react'
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
  onBack: () => void
  onSettings?: () => void
}

const SESSION_MENU_ITEMS = [
  { id: 'rename', label: 'Rename' },
  { id: 'delete', label: 'Delete conversation' },
] as const

function SessionRowItem({
  session,
  onOpen,
}: {
  session: SessionSummary
  onOpen: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <li>
      <div className={styles.sessionRow}>
        <button type="button" className={styles.sessionOpenBtn} onClick={() => onOpen(session.id)}>
          <div className={styles.sessionBody}>
            <p className={styles.sessionTitle}>{session.title}</p>
            <p className={styles.sessionPreview}>{session.preview}</p>
            <p className={styles.sessionMeta}>{session.updatedLabel}</p>
          </div>
        </button>
        <div className={styles.sessionMenuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.sessionMenuBtn}
            onClick={(event) => {
              event.stopPropagation()
              setMenuOpen((open) => !open)
            }}
            aria-label={`Options for ${session.title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <DotsThreeVertical size={16} weight="bold" aria-hidden />
          </button>
          {menuOpen ? (
            <div className={styles.sessionMenu} role="menu" aria-label={`${session.title} options`}>
              {SESSION_MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={styles.sessionMenuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function SessionsPanel({ onOpenSession, onNewSession, onBack, onSettings }: SessionsPanelProps) {
  const scrollRef = useRevealScrollbarOnScroll()
  const open = useCallback(
    (id: string) => {
      onOpenSession(id)
    },
    [onOpenSession],
  )

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <button type="button" className={styles.headerBtn} onClick={onBack} aria-label="Back to chat">
            <ArrowLeft size={20} weight="regular" aria-hidden />
          </button>
          <h2 className={styles.heading}>Conversations</h2>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onSettings}
            aria-label="Conversation settings"
          >
            <Gear size={20} weight="regular" aria-hidden />
          </button>
        </div>
      </div>
      <div className={styles.headerSeparator} />
      <div ref={scrollRef} className={styles.scroll}>
        <p className={styles.subtitle}>
          Open a recent conversation or start something new.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={onNewSession}>
            <Plus size={18} weight="regular" aria-hidden />
            New session
          </button>
        </div>

        <h3 className={styles.sectionLabel}>Recent</h3>

        {MOCK_SESSIONS.length === 0 ? (
          <p className={styles.empty}>No sessions yet. Start a new one above.</p>
        ) : (
          <ul className={styles.list}>
            {MOCK_SESSIONS.map((s) => (
              <SessionRowItem key={s.id} session={s} onOpen={open} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
