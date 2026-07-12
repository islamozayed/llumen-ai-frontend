import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowsInSimple,
  ArrowsOutSimple,
  CaretDown,
  List,
  MagnifyingGlass,
  ArrowLeft,
  X,
} from '@phosphor-icons/react'
import styles from './compact-assistant.module.css'

export type PanelView = 'chat' | 'sessions'

export type ChatQuestionIndexItem = {
  id: string
  question: string
  /** Scroll target — usually the assistant reply that follows this question. */
  responseId: string
}

export type PanelHeaderProps = {
  onClose: () => void
  panelView: PanelView
  onOpenSessions: () => void
  onBackToChat: () => void
  expanded?: boolean
  onToggleExpanded?: () => void
  chatTitle?: string
  onChatTitleChange?: (title: string) => void
  questions?: ChatQuestionIndexItem[]
  onJumpToResponse?: (responseId: string) => void
}

export function PanelHeader({
  onClose,
  panelView,
  onOpenSessions,
  onBackToChat,
  expanded = false,
  onToggleExpanded,
  chatTitle = 'New chat',
  onChatTitleChange,
  questions = [],
  onJumpToResponse,
}: PanelHeaderProps) {
  const sessionsOpen = panelView === 'sessions'
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(chatTitle)
  const [titleHovered, setTitleHovered] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const indexWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionsOpen) {
      setSearchOpen(false)
      setIndexOpen(false)
      setEditingTitle(false)
    }
  }, [sessionsOpen])

  useEffect(() => {
    if (!editingTitle) setTitleDraft(chatTitle)
  }, [chatTitle, editingTitle])

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

  useLayoutEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    if (!indexOpen) return
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (indexWrapRef.current?.contains(target)) return
      setIndexOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndexOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [indexOpen])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  const commitTitle = () => {
    const next = titleDraft.trim() || 'New chat'
    setTitleDraft(next)
    onChatTitleChange?.(next)
    setEditingTitle(false)
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
            <MagnifyingGlass className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          </button>
        )}
      </div>

      {!sessionsOpen ? (
        <div
          className={styles.headerTitleCluster}
          onMouseEnter={() => setTitleHovered(true)}
          onMouseLeave={() => {
            if (!editingTitle && !indexOpen) setTitleHovered(false)
          }}
        >
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className={styles.headerTitleInput}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitTitle()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setTitleDraft(chatTitle)
                  setEditingTitle(false)
                }
              }}
              aria-label="Chat title"
            />
          ) : (
            <button
              type="button"
              className={`${styles.headerTitleBtn}${titleHovered ? ` ${styles.headerTitleBtnHover}` : ''}`}
              onClick={() => {
                setTitleDraft(chatTitle)
                setEditingTitle(true)
              }}
              title="Edit chat title"
            >
              <span className={styles.headerTitleText}>{chatTitle}</span>
            </button>
          )}

          <div className={styles.headerIndexWrap} ref={indexWrapRef}>
            <button
              type="button"
              className={`${styles.headerBtn}${indexOpen ? ` ${styles.headerBtnActive}` : ''}`}
              aria-label="Conversation questions"
              aria-expanded={indexOpen}
              aria-haspopup="menu"
              disabled={questions.length === 0}
              onClick={() => setIndexOpen((v) => !v)}
            >
              <CaretDown className={styles.headerPhosphor} size={16} weight="bold" aria-hidden />
            </button>
            {indexOpen ? (
              <div className={styles.headerIndexMenu} role="menu" aria-label="Questions in this chat">
                {questions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={styles.headerIndexItem}
                    onClick={() => {
                      onJumpToResponse?.(item.responseId)
                      setIndexOpen(false)
                    }}
                  >
                    <span className={styles.headerIndexItemNum}>{index + 1}</span>
                    <span className={styles.headerIndexItemText}>{item.question}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.headerTitleSpacer} aria-hidden />
      )}

      <div className={styles.headerActions}>
        {!sessionsOpen && onToggleExpanded ? (
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onToggleExpanded}
            aria-label={expanded ? 'Exit full screen' : 'Enter full screen'}
          >
            {expanded ? (
              <ArrowsInSimple className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
            ) : (
              <ArrowsOutSimple className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
            )}
          </button>
        ) : null}
        <button type="button" className={styles.headerBtn} onClick={onClose} aria-label="Close assistant">
          <X className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
        </button>
      </div>
    </div>
  )
}
