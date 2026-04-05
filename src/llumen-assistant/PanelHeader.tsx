import { ArrowLeft, Chats } from '@phosphor-icons/react'
import { llumenAssets } from './assets'
import styles from './compact-assistant.module.css'

export type PanelView = 'chat' | 'sessions'

export type PanelHeaderProps = {
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
  panelView: PanelView
  onOpenSessions: () => void
  onBackToChat: () => void
}

export function PanelHeader({
  isExpanded,
  onToggleExpand,
  onClose,
  panelView,
  onOpenSessions,
  onBackToChat,
}: PanelHeaderProps) {
  const sessionsOpen = panelView === 'sessions'

  return (
    <div className={styles.headerRow}>
      <div className={styles.headerPill}>
        <button
          type="button"
          className={styles.headerBtn}
          onClick={sessionsOpen ? onBackToChat : onOpenSessions}
          aria-label={sessionsOpen ? 'Back to chat' : 'Sessions and projects'}
        >
          {sessionsOpen ? (
            <ArrowLeft className={styles.headerPhosphor} size={20} weight="duotone" aria-hidden />
          ) : (
            <Chats className={styles.headerPhosphor} size={20} weight="duotone" aria-hidden />
          )}
        </button>
      </div>
      <div className={styles.headerPill}>
        <button
          type="button"
          className={styles.headerBtn}
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Exit expanded view' : 'Expand assistant'}
          aria-pressed={isExpanded}
        >
          <img className={styles.headerIcon} src={llumenAssets.arrowsOut} alt="" width={20} height={20} />
        </button>
        <button type="button" className={styles.headerBtn} onClick={onClose} aria-label="Close assistant">
          <img className={styles.headerIcon} src={llumenAssets.close} alt="" width={20} height={20} />
        </button>
      </div>
    </div>
  )
}
