import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, List, MagnifyingGlass, X } from '@phosphor-icons/react'
import styles from './compact-assistant.module.css'

export type PanelView = 'chat' | 'sessions'

export type PanelHeaderProps = {
  onClose: () => void
  panelView: PanelView
  onOpenSessions: () => void
  onBackToChat: () => void
}

export function PanelHeader({
  onClose,
  panelView,
  onOpenSessions,
  onBackToChat,
}: PanelHeaderProps) {
  const sessionsOpen = panelView === 'sessions'
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sessionsOpen) setSearchOpen(false)
  }, [sessionsOpen])

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [searchOpen])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  if (searchOpen && !sessionsOpen) {
    return (
      <div className={styles.headerRow}>
        <div className={styles.headerSearchBar}>
          <input
            ref={searchInputRef}
            type="search"
            className={styles.headerSearchInput}
            placeholder="Find in conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Find in conversation"
          />
          <button type="button" className={styles.headerSearchClose} onClick={closeSearch} aria-label="Close search">
            <X className={styles.headerPhosphor} size={18} weight="regular" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.headerRow}>
      <div className={styles.headerActions}>
        <button
          type="button"
          className={styles.headerBtn}
          onClick={sessionsOpen ? onBackToChat : onOpenSessions}
          aria-label={sessionsOpen ? 'Back to chat' : 'Open menu'}
        >
          {sessionsOpen ? (
            <ArrowLeft className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          ) : (
            <List className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          )}
        </button>
        {!sessionsOpen && (
          <button
            type="button"
            className={styles.headerSearchBtn}
            onClick={() => setSearchOpen(true)}
            aria-label="Search conversations"
          >
            <span className={styles.headerSearchContent}>
              <span className={styles.headerSearchIcon}>
                <MagnifyingGlass className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
              </span>
              <span className={styles.headerSearchLabel}>Search</span>
            </span>
          </button>
        )}
      </div>
      <button type="button" className={styles.headerBtn} onClick={onClose} aria-label="Close assistant">
        <X className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
      </button>
    </div>
  )
}
