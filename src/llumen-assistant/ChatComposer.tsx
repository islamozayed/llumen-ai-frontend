import {
  Article,
  CaretUp,
  ClipboardText,
  Database,
  File,
  Image as ImageIcon,
  Microphone,
  Plus,
  SquaresFour,
  X,
} from '@phosphor-icons/react'
import gsap from 'gsap'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { llumenAssets } from './assets'
import styles from './compact-assistant.module.css'
import type { SendVisualState } from './SendButton'
import { SendButton } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

/** Matches reference LlumenChatInput textarea max-height */
const MAX_COMPOSER_PX = 120
const COMPOSER_HEIGHT_DURATION = 0.38
const COMPOSER_HEIGHT_EASE = 'power2.inOut'

type AttachKind = 'file' | 'data-source' | 'story' | 'visual' | 'briefing'

type ComposerContext = {
  id: string
  kind: AttachKind
  name: string
  typeBadge: string
  thumbSrc?: string
}

const ATTACH_MENU_ITEMS = {
  files: [{ id: 'file' as const, label: 'File', icon: File }],
  context: [
    { id: 'data-source' as const, label: 'Data Source', icon: Database },
    { id: 'story' as const, label: 'Story', icon: Article },
    { id: 'visual' as const, label: 'Visual', icon: SquaresFour },
    { id: 'briefing' as const, label: 'Briefing', icon: ClipboardText },
  ],
} as const

const CONTEXT_SAMPLES: Record<AttachKind, Omit<ComposerContext, 'id'>[]> = {
  file: [
    { kind: 'file', name: 'appverifUI.dll', typeBadge: 'DLL' },
    { kind: 'file', name: 'station-export.csv', typeBadge: 'CSV' },
    { kind: 'file', name: 'ops-notes.pdf', typeBadge: 'PDF' },
  ],
  'data-source': [
    { kind: 'data-source', name: 'Air Quality Stations', typeBadge: 'SRC' },
    { kind: 'data-source', name: 'Population Census', typeBadge: 'SRC' },
    { kind: 'data-source', name: 'Land-use Inventory', typeBadge: 'SRC' },
  ],
  story: [
    { kind: 'story', name: 'Marina logistics brief', typeBadge: 'STORY' },
    { kind: 'story', name: 'Weekly ops recap', typeBadge: 'STORY' },
    { kind: 'story', name: 'Incident response playbook', typeBadge: 'STORY' },
  ],
  visual: [
    {
      kind: 'visual',
      name: 'Abu Dhabi AQI',
      typeBadge: 'IMG',
      thumbSrc: llumenAssets.mapAbuDhabiAqi,
    },
    {
      kind: 'visual',
      name: 'Store traffic index',
      typeBadge: 'IMG',
      thumbSrc: llumenAssets.mapStoreTrafficIndex,
    },
    {
      kind: 'visual',
      name: 'High heat districts',
      typeBadge: 'IMG',
      thumbSrc: llumenAssets.chartHighHeatDistricts,
    },
  ],
  briefing: [
    { kind: 'briefing', name: 'Q1 KPI briefing', typeBadge: 'BRIEF' },
    { kind: 'briefing', name: 'Executive AQI assessment', typeBadge: 'BRIEF' },
    { kind: 'briefing', name: 'Exposure priority memo', typeBadge: 'BRIEF' },
  ],
}

const KIND_ICON = {
  file: File,
  'data-source': Database,
  story: Article,
  visual: ImageIcon,
  briefing: ClipboardText,
} as const

type AttachMenuPosition = {
  left: number
  bottom: number
}

function AttachMenuPanel({
  menuRef,
  position,
  onSelect,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>
  position: AttachMenuPosition
  onSelect: (kind: AttachKind) => void
}) {
  return (
    <div
      ref={menuRef}
      className={styles.attachMenu}
      style={{ left: position.left, bottom: position.bottom }}
      role="menu"
      aria-label="Attach and context"
      data-lc-attach-menu
    >
      <p className={styles.attachMenuSection}>Attach files</p>
      {ATTACH_MENU_ITEMS.files.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={styles.attachMenuItem}
          onClick={() => onSelect(item.id)}
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
          onClick={() => onSelect(item.id)}
        >
          <item.icon className={styles.attachMenuIcon} size={16} weight="regular" aria-hidden />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function ContextChip({
  item,
  onRemove,
}: {
  item: ComposerContext
  onRemove: (id: string) => void
}) {
  const Icon = KIND_ICON[item.kind]
  const isImageChip = Boolean(item.thumbSrc)

  return (
    <div
      className={`${styles.contextChip}${isImageChip ? ` ${styles.contextChipImage}` : ''}`}
      title={item.name}
      aria-label={isImageChip ? item.name : undefined}
    >
      {item.thumbSrc ? (
        <span
          className={styles.contextChipThumb}
          style={{ backgroundImage: `url(${item.thumbSrc})` }}
          aria-hidden
        />
      ) : null}
      {!isImageChip ? (
        <>
          <p className={styles.contextChipName}>{item.name}</p>
          <div className={styles.contextChipFooter}>
            <Icon className={styles.contextChipKindIcon} size={14} weight="regular" aria-hidden />
            <span className={styles.contextChipBadge}>{item.typeBadge}</span>
          </div>
        </>
      ) : null}
      <button
        type="button"
        className={styles.contextChipRemove}
        aria-label={`Remove ${item.name}`}
        onClick={() => onRemove(item.id)}
      >
        <X size={12} weight="bold" aria-hidden />
      </button>
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
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const composerHeightRef = useRef<number | null>(null)
  const attachWrapRef = useRef<HTMLDivElement>(null)
  const attachBtnRef = useRef<HTMLButtonElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const kindCountersRef = useRef<Record<AttachKind, number>>({
    file: 0,
    'data-source': 0,
    story: 0,
    visual: 0,
    briefing: 0,
  })
  const uid = useId()
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [attachMenuPos, setAttachMenuPos] = useState<AttachMenuPosition | null>(null)
  const [contexts, setContexts] = useState<ComposerContext[]>([])
  const chatScrollRef = useRevealScrollbarOnScroll()

  const syncComposerReserve = useCallback((heightPx: number) => {
    const el = chatBoxRef.current
    const middle = el?.parentElement
    if (!middle) return
    middle.style.setProperty('--lc-composer-reserve', `${Math.ceil(heightPx)}px`)
  }, [])

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

  useLayoutEffect(() => {
    const el = chatBoxRef.current
    if (!el) return

    gsap.killTweensOf(el)
    gsap.set(el, { height: 'auto', maxHeight: contexts.length > 0 ? 320 : 200 })
    const nextHeight = el.offsetHeight
    const prevHeight = composerHeightRef.current

    if (prevHeight == null || Math.abs(prevHeight - nextHeight) < 1) {
      composerHeightRef.current = nextHeight
      gsap.set(el, { clearProps: 'height,maxHeight' })
      syncComposerReserve(nextHeight)
      return
    }

    gsap.set(el, {
      height: prevHeight,
      maxHeight: Math.max(prevHeight, nextHeight, 320),
      overflow: 'hidden',
    })
    syncComposerReserve(prevHeight)

    const tween = gsap.to(el, {
      height: nextHeight,
      duration: COMPOSER_HEIGHT_DURATION,
      ease: COMPOSER_HEIGHT_EASE,
      onUpdate: () => {
        syncComposerReserve(el.offsetHeight)
      },
      onComplete: () => {
        gsap.set(el, { clearProps: 'height,maxHeight,overflow' })
        composerHeightRef.current = el.offsetHeight
        syncComposerReserve(el.offsetHeight)
      },
    })

    return () => {
      composerHeightRef.current = el.offsetHeight
      tween.kill()
      gsap.set(el, { clearProps: 'height,maxHeight,overflow' })
    }
  }, [contexts, syncComposerReserve])

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

  const addContext = (kind: AttachKind) => {
    const samples = CONTEXT_SAMPLES[kind]
    const index = kindCountersRef.current[kind] % samples.length
    kindCountersRef.current[kind] += 1
    const sample = samples[index]
    setContexts((prev) => [
      ...prev,
      {
        ...sample,
        id: `${uid}-${kind}-${kindCountersRef.current[kind]}`,
      },
    ])
    setAttachMenuOpen(false)
  }

  const removeContext = (id: string) => {
    setContexts((prev) => prev.filter((item) => item.id !== id))
  }

  const hasContexts = contexts.length > 0

  return (
    <div
      ref={chatBoxRef}
      className={`${styles.chatBox}${hasContexts ? ` ${styles.chatBoxWithContexts}` : ''}`}
      data-lc-composer=""
    >
      {hasContexts ? (
        <div className={styles.contextChipRow} aria-label="Attached context">
          {contexts.map((item) => (
            <ContextChip key={item.id} item={item} onRemove={removeContext} />
          ))}
        </div>
      ) : null}
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
                      onSelect={addContext}
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
