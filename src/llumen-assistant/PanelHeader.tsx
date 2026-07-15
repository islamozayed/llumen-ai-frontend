import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowsInSimple,
  ArrowsOutSimple,
  List,
  MagnifyingGlass,
  Plus,
  X,
} from '@phosphor-icons/react'
import { SessionsPanel } from './SessionsPanel'
import styles from './compact-assistant.module.css'

export type ChatQuestionIndexItem = {
  id: string
  question: string
  /** Scroll target — the user message that was submitted. */
  responseId: string
}

export type PanelHeaderProps = {
  onClose: () => void
  expanded?: boolean
  onToggleExpanded?: () => void
  chatTitle?: string
  onChatTitleChange?: (title: string) => void
  onOpenSession?: (id: string) => void
  onNewSession?: () => void
  /** Hide in-conversation search and title edit until at least one assistant reply exists. */
  hasAssistantReply?: boolean
  /** Subcontext/detail panel is open (split view). */
  splitOpen?: boolean
}

export function PanelHeader({
  onClose,
  expanded = false,
  onToggleExpanded,
  chatTitle = 'New chat',
  onChatTitleChange,
  onOpenSession,
  onNewSession,
  hasAssistantReply = false,
  splitOpen = false,
}: PanelHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(chatTitle)
  const [titleHovered, setTitleHovered] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const sessionsWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editingTitle) setTitleDraft(chatTitle)
  }, [chatTitle, editingTitle])

  useEffect(() => {
    if (!hasAssistantReply) {
      setSearchOpen(false)
      setSearchQuery('')
      setEditingTitle(false)
    }
  }, [hasAssistantReply])

  // Fullscreen + subcontext: dismiss conversation history if it was open.
  useEffect(() => {
    if (expanded && splitOpen) setSessionsOpen(false)
  }, [expanded, splitOpen])

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
    if (!sessionsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSessionsOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (sessionsWrapRef.current?.contains(target)) return
      setSessionsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [sessionsOpen])

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

  if (searchOpen && hasAssistantReply) {
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
            <X className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.headerRow}>
      <div className={styles.headerActions}>
        <div className={styles.headerSessionsWrap} ref={sessionsWrapRef}>
          <button
            type="button"
            className={`${styles.headerBtn}${sessionsOpen ? ` ${styles.headerBtnActive}` : ''}`}
            onClick={() => setSessionsOpen((v) => !v)}
            aria-label="Conversations"
            aria-expanded={sessionsOpen}
            aria-haspopup="menu"
          >
            <List className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          </button>
          {sessionsOpen ? (
            <div
              className={styles.headerSessionsMenu}
              role="menu"
              aria-label="Conversations"
              data-lc-sessions-menu
            >
              <SessionsPanel
                onOpenSession={(id) => {
                  onOpenSession?.(id)
                  setSessionsOpen(false)
                }}
              />
            </div>
          ) : null}
        </div>
        {onNewSession ? (
          <button
            type="button"
            className={styles.headerBtn}
            onClick={onNewSession}
            aria-label="New conversation"
            title="New conversation"
          >
            <Plus className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          </button>
        ) : null}
      </div>

      <div
        className={styles.headerTitleCluster}
        onMouseEnter={() => {
          if (hasAssistantReply) setTitleHovered(true)
        }}
        onMouseLeave={() => {
          if (!editingTitle) setTitleHovered(false)
        }}
      >
        {editingTitle && hasAssistantReply ? (
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
        ) : hasAssistantReply ? (
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
        ) : (
          <span className={styles.headerTitleStatic}>
            <span className={styles.headerTitleText}>{chatTitle}</span>
          </span>
        )}

        {hasAssistantReply ? (
          <button
            type="button"
            className={styles.headerSearchBtn}
            onClick={() => setSearchOpen(true)}
            aria-label="Find in conversation"
          >
            <MagnifyingGlass className={styles.headerPhosphor} size={20} weight="regular" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className={styles.headerActions}>
        {onToggleExpanded ? (
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
