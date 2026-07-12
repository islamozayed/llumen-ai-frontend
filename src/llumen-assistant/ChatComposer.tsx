import {
  Article,
  CaretUp,
  ClipboardText,
  Database,
  File,
  Microphone,
  Plus,
  SquaresFour,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from './compact-assistant.module.css'
import type { SendVisualState } from './SendButton'
import { SendButton } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

/** Matches reference LlumenChatInput textarea max-height */
const MAX_COMPOSER_PX = 120

const ATTACH_MENU_ITEMS = {
  files: [{ id: 'file', label: 'File', icon: File }],
  context: [
    { id: 'data-source', label: 'Data Source', icon: Database },
    { id: 'story', label: 'Story', icon: Article },
    { id: 'visual', label: 'Visual', icon: SquaresFour },
    { id: 'briefing', label: 'Briefing', icon: ClipboardText },
  ],
} as const

type AttachMenuPosition = {
  left: number
  bottom: number
}

function AttachMenuPanel({
  menuRef,
  position,
  onClose,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>
  position: AttachMenuPosition
  onClose: () => void
}) {
  return (
    <div
      ref={menuRef}
      className={styles.attachMenu}
      style={{ left: position.left, bottom: position.bottom }}
      role="menu"
      aria-label="Attach and context"
    >
      <p className={styles.attachMenuSection}>Attach files</p>
      {ATTACH_MENU_ITEMS.files.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={styles.attachMenuItem}
          onClick={onClose}
        >
          <item.icon className={styles.attachMenuIcon} size={16} weight="regular" aria-hidden />
          <span>{item.label}</span>
        </button>
      ))}
      <div className={styles.attachMenuDivider} role="separator" />
      <p className={styles.attachMenuSection}>Add context</p>
      {ATTACH_MENU_ITEMS.context.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={styles.attachMenuItem}
          onClick={onClose}
        >
          <item.icon className={styles.attachMenuIcon} size={16} weight="regular" aria-hidden />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export type ChatComposerProps = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop: () => void
  sendState: SendVisualState
  showParameters?: boolean
  onAttachClick?: () => void
  disabled?: boolean
  hasThreadMessages?: boolean
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  sendState,
  showParameters = true,
  onAttachClick,
  disabled = false,
  hasThreadMessages = false,
}: ChatComposerProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const attachWrapRef = useRef<HTMLDivElement>(null)
  const attachBtnRef = useRef<HTMLButtonElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [attachMenuPos, setAttachMenuPos] = useState<AttachMenuPosition | null>(null)
  const chatScrollRef = useRevealScrollbarOnScroll()

  const updateAttachMenuPos = useCallback(() => {
    const btn = attachBtnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setAttachMenuPos({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 8,
    })
  }, [])

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_PX)}px`
  }, [value])

  useEffect(() => {
    if (!attachMenuOpen) {
      setAttachMenuPos(null)
      return
    }
    updateAttachMenuPos()
    window.addEventListener('resize', updateAttachMenuPos)
    window.addEventListener('scroll', updateAttachMenuPos, true)
    return () => {
      window.removeEventListener('resize', updateAttachMenuPos)
      window.removeEventListener('scroll', updateAttachMenuPos, true)
    }
  }, [attachMenuOpen, updateAttachMenuPos])

  useEffect(() => {
    if (!attachMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (attachWrapRef.current?.contains(target) || attachMenuRef.current?.contains(target)) return
      setAttachMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [attachMenuOpen])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (sendState === 'stop') return
      if (sendState === 'active') onSend()
    }
  }

  const toggleAttachMenu = () => {
    if (!showParameters) return
    setAttachMenuOpen((open) => !open)
    onAttachClick?.()
  }

  return (
    <div className={styles.chatBox} data-lc-composer="">
      <div className={styles.textAreaWrap}>
        <textarea
          ref={(el) => {
            taRef.current = el
            chatScrollRef(el)
          }}
          className={styles.textArea}
          placeholder={hasThreadMessages ? 'Reply...' : 'Ask about anything'}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || sendState === 'stop'}
          aria-label={hasThreadMessages ? 'Reply' : 'Message'}
        />
      </div>
      <div className={styles.paramsCol}>
        <div className={styles.rowPrimary}>
          <div className={styles.rowPrimaryLeft}>
            {showParameters && (
              <div className={styles.contextBtnWrap} ref={attachWrapRef}>
                {attachMenuOpen &&
                  attachMenuPos &&
                  createPortal(
                    <AttachMenuPanel
                      menuRef={attachMenuRef}
                      position={attachMenuPos}
                      onClose={() => setAttachMenuOpen(false)}
                    />,
                    document.body,
                  )}
                <button
                  ref={attachBtnRef}
                  type="button"
                  className={`${styles.contextBtn}${attachMenuOpen ? ` ${styles.contextBtnActive}` : ''}`}
                  aria-label="Add context or attachment"
                  aria-expanded={attachMenuOpen}
                  aria-haspopup="menu"
                  onClick={toggleAttachMenu}
                >
                  <Plus className={styles.contextBtnIcon} size={18} weight="regular" aria-hidden />
                  <CaretUp
                    className={`${styles.contextBtnCaret}${attachMenuOpen ? ` ${styles.contextBtnCaretOpen}` : ''}`}
                    size={14}
                    weight="bold"
                    aria-hidden
                  />
                </button>
              </div>
            )}
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Voice input">
            <Microphone className={styles.iconBtnImg} size={20} weight="regular" aria-hidden />
          </button>
          <SendButton
            state={sendState}
            onClick={() => {
              if (sendState === 'stop') onStop()
              else onSend()
            }}
          />
        </div>
      </div>
    </div>
  )
}
