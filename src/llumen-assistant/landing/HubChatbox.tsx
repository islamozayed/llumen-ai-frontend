import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArrowUp, At, ClockCounterClockwise, File, Paperclip, X } from '@phosphor-icons/react'
import gsap from 'gsap'
import { llumenAssets } from '../assets'
import { InlineContextMenu } from '../InlineContextMenu'
import {
  filterCategories,
  filterItems,
  getCategoryIcon,
  type InlineContextCategoryId,
  type InlineContextItem,
} from '../inlineContextData'
import panelStyles from '../compact-assistant.module.css'
import type { LandingContextChip } from './LandingChatbox'
import styles from './HubChatbox.module.css'

type HubFileChip = {
  id: string
  name: string
  typeBadge: string
  thumbSrc?: string
}

const FILE_SAMPLES: Omit<HubFileChip, 'id'>[] = [
  { name: 'ops-notes.pdf', typeBadge: 'PDF' },
  { name: 'station-export.csv', typeBadge: 'CSV' },
  {
    name: 'abu-dhabi-aqi.png',
    typeBadge: 'PNG',
    thumbSrc: llumenAssets.mapAbuDhabiAqi,
  },
  { name: 'corridor-brief.docx', typeBadge: 'DOCX' },
]

function serializeEditor(root: HTMLElement): string {
  let out = ''
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    if (el.dataset.inlineMention != null) {
      out += `@${el.dataset.mentionName ?? ''}`
      return
    }
    if (el.tagName === 'BR') {
      out += '\n'
      return
    }
    el.childNodes.forEach(walk)
  }
  root.childNodes.forEach(walk)
  return out.replace(/\u00a0/g, ' ')
}

function editorIsEmpty(root: HTMLElement): boolean {
  const text = root.innerText.replace(/\u00a0/g, ' ').replace(/\n/g, '').trim()
  return text.length === 0 && !root.querySelector('[data-inline-mention]')
}

function createInlineMentionChip(item: InlineContextItem): HTMLSpanElement {
  const Icon = getCategoryIcon(item.categoryId)
  const chip = document.createElement('span')
  chip.className = panelStyles.inlineMention
  chip.contentEditable = 'false'
  chip.dataset.inlineMention = item.id
  chip.dataset.mentionName = item.name
  chip.dataset.mentionCategory = item.categoryId

  const iconHost = document.createElement('span')
  iconHost.className = panelStyles.inlineMentionIcon
  iconHost.setAttribute('aria-hidden', 'true')
  iconHost.innerHTML = renderToStaticMarkup(<Icon size={12} weight="bold" />)

  const label = document.createElement('span')
  label.className = panelStyles.inlineMentionLabel
  label.textContent = item.name

  chip.append(iconHost, label)
  return chip
}

function chipToMentionItem(chip: LandingContextChip): InlineContextItem {
  return {
    id: chip.id,
    name: chip.label,
    categoryId: chip.categoryId ?? 'briefings',
    description: chip.domain,
  }
}

function ensureCaretInEditor(editor: HTMLElement) {
  editor.focus()
  const sel = window.getSelection()
  if (!sel) return
  if (sel.rangeCount && editor.contains(sel.anchorNode)) return
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

export type HubChatboxProps = {
  onSubmit: (text: string, chips: LandingContextChip[]) => void
  chips?: LandingContextChip[]
  onRemoveChip?: (id: string) => void
  onOpenSessions: () => void
  focusToken?: number
  exiting?: boolean
  placement?: 'landing' | 'story'
  /** Shift horizontally when the sessions rail is open beside the landing. */
  railOpen?: boolean
  morphFrom?: DOMRect | null
  /** When set, shows an X to collapse the hub (e.g. back to the Story ask orb). */
  onCollapse?: () => void
}

export function HubChatbox({
  onSubmit,
  chips = [],
  onRemoveChip,
  onOpenSessions,
  focusToken = 0,
  exiting = false,
  placement = 'landing',
  railOpen = false,
  morphFrom = null,
  onCollapse,
}: HubChatboxProps) {
  const [focused, setFocused] = useState(false)
  const [editorEmpty, setEditorEmpty] = useState(true)
  const [serialized, setSerialized] = useState('')
  const [files, setFiles] = useState<HubFileChip[]>([])
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionStage, setMentionStage] = useState<'categories' | 'items'>('categories')
  const [mentionCategory, setMentionCategory] = useState<InlineContextCategoryId | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionPos, setMentionPos] = useState({ left: 0, bottom: 0 })
  const fileCounterRef = useRef(0)
  const uid = useId()
  const editorRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLFormElement>(null)
  const mentionBtnRef = useRef<HTMLButtonElement>(null)
  const mentionMenuRef = useRef<HTMLDivElement>(null)
  const insertedChipIdsRef = useRef<Set<string>>(new Set())
  const morphOriginRef = useRef<DOMRect | null>(null)
  const [morphingOut, setMorphingOut] = useState(false)

  const expanded = focused || !editorEmpty || files.length > 0 || mentionOpen
  const idle = !focused && editorEmpty && files.length === 0 && !mentionOpen
  const canSend = !editorEmpty || files.length > 0
  const interactionLocked = exiting || morphingOut
  const categories = useMemo(() => filterCategories(''), [])
  const items = useMemo(
    () => (mentionCategory ? filterItems(mentionCategory, '') : []),
    [mentionCategory],
  )

  const syncEditor = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    setEditorEmpty(editorIsEmpty(el))
    setSerialized(serializeEditor(el))
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [])

  const closeMention = useCallback(() => {
    setMentionOpen(false)
    setMentionStage('categories')
    setMentionCategory(null)
    setMentionIndex(0)
  }, [])

  const insertInlineMention = useCallback(
    (item: InlineContextItem) => {
      const editor = editorRef.current
      if (!editor || exiting) return
      ensureCaretInEditor(editor)
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) return
      const range = sel.getRangeAt(0)
      range.deleteContents()

      const chip = createInlineMentionChip(item)
      range.insertNode(chip)
      const space = document.createTextNode('\u00a0')
      chip.after(space)

      const after = document.createRange()
      after.setStart(space, space.data.length)
      after.collapse(true)
      sel.removeAllRanges()
      sel.addRange(after)

      insertedChipIdsRef.current.add(item.id)
      closeMention()
      syncEditor()
    },
    [closeMention, exiting, syncEditor],
  )

  // External context (Story / Tell Me More) → inline mention chips in the editor
  useEffect(() => {
    if (exiting || chips.length === 0) return
    const editor = editorRef.current
    if (!editor) return

    let inserted = false
    for (const chip of chips) {
      if (insertedChipIdsRef.current.has(chip.id)) {
        onRemoveChip?.(chip.id)
        continue
      }
      if (editor.querySelector(`[data-inline-mention="${CSS.escape(chip.id)}"]`)) {
        insertedChipIdsRef.current.add(chip.id)
        onRemoveChip?.(chip.id)
        continue
      }
      ensureCaretInEditor(editor)
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) continue
      const range = sel.getRangeAt(0)
      range.collapse(false)
      const mention = createInlineMentionChip(chipToMentionItem(chip))
      range.insertNode(mention)
      const space = document.createTextNode('\u00a0')
      mention.after(space)
      const after = document.createRange()
      after.setStart(space, space.data.length)
      after.collapse(true)
      sel.removeAllRanges()
      sel.addRange(after)
      insertedChipIdsRef.current.add(chip.id)
      onRemoveChip?.(chip.id)
      inserted = true
    }
    if (inserted) syncEditor()
  }, [chips, exiting, onRemoveChip, syncEditor])

  useEffect(() => {
    if (focusToken <= 0 || exiting) return
    editorRef.current?.focus()
  }, [focusToken, exiting])

  useEffect(() => {
    if (morphFrom) morphOriginRef.current = morphFrom
  }, [morphFrom])

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el || !morphFrom || exiting) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const dest = el.getBoundingClientRect()
    const dx = morphFrom.left + morphFrom.width / 2 - (dest.left + dest.width / 2)
    const dy = morphFrom.top + morphFrom.height / 2 - (dest.top + dest.height / 2)
    gsap.killTweensOf(el)
    gsap.fromTo(
      el,
      {
        x: dx,
        y: dy,
        scale: Math.max(0.18, morphFrom.width / Math.max(dest.width, 1)),
        opacity: 0.4,
      },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.42, ease: 'power3.out' },
    )
    return () => {
      gsap.killTweensOf(el)
    }
  }, [morphFrom, exiting])

  useEffect(() => {
    if (!mentionOpen) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (mentionMenuRef.current?.contains(target)) return
      if (mentionBtnRef.current?.contains(target)) return
      closeMention()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [mentionOpen, closeMention])

  const placeMentionMenu = () => {
    const btn = mentionBtnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMentionPos({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 8,
    })
  }

  const openMention = () => {
    if (interactionLocked) return
    placeMentionMenu()
    setMentionOpen(true)
    setMentionStage('categories')
    setMentionCategory(null)
    setMentionIndex(0)
  }

  const addFile = () => {
    if (interactionLocked) return
    const sample = FILE_SAMPLES[fileCounterRef.current % FILE_SAMPLES.length]
    fileCounterRef.current += 1
    setFiles((prev) => [
      ...prev,
      { ...sample, id: `${uid}-file-${fileCounterRef.current}` },
    ])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id))
  }

  const selectCategory = (id: InlineContextCategoryId) => {
    setMentionCategory(id)
    setMentionStage('items')
    setMentionIndex(0)
  }

  const collapse = useCallback(() => {
    if (interactionLocked || !onCollapse) return
    closeMention()

    const el = boxRef.current
    const origin = morphOriginRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || !origin || reduceMotion) {
      onCollapse()
      return
    }

    setMorphingOut(true)
    const dest = el.getBoundingClientRect()
    const dx = origin.left + origin.width / 2 - (dest.left + dest.width / 2)
    const dy = origin.top + origin.height / 2 - (dest.top + dest.height / 2)
    const scale = Math.max(0.18, origin.width / Math.max(dest.width, 1))
    gsap.killTweensOf(el)
    gsap.to(el, {
      x: dx,
      y: dy,
      scale,
      opacity: 0,
      duration: 0.42,
      ease: 'power3.in',
      onComplete: () => {
        onCollapse()
      },
    })
  }, [closeMention, interactionLocked, onCollapse])

  const send = () => {
    if (interactionLocked || !canSend) return
    const editor = editorRef.current
    const text = editor ? serializeEditor(editor).trim() : serialized.trim()
    const fileChips: LandingContextChip[] = files.map((file) => ({
      id: file.id,
      label: file.name,
      categoryId: 'assets' as const,
    }))
    onSubmit(text, fileChips)
    if (editor) {
      editor.innerHTML = ''
      insertedChipIdsRef.current.clear()
    }
    setFiles([])
    closeMention()
    syncEditor()
  }

  const showPlaceholder = editorEmpty && files.length === 0
  const placeholder = showPlaceholder ? 'Ask Llumen anything…' : ''

  return (
    <div
      className={`${styles.root}${placement === 'story' ? ` ${styles.rootStory}` : ''}${
        railOpen ? ` ${styles.rootShifted}` : ''
      }${exiting ? ` ${styles.rootExiting}` : ''}${morphingOut ? ` ${styles.rootMorphingOut}` : ''}`}
      aria-hidden={exiting || morphingOut}
    >
      <form
        ref={boxRef}
        className={styles.box}
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        {files.length > 0 ? (
          <div
            className={`${panelStyles.contextChipRow} ${styles.chipRow}`}
            aria-label="Attached files"
          >
            {files.map((file) => {
              const isImageChip = Boolean(file.thumbSrc)
              return (
                <div
                  key={file.id}
                  className={`${panelStyles.contextChip}${
                    isImageChip ? ` ${panelStyles.contextChipImage}` : ''
                  }`}
                  title={file.name}
                  aria-label={isImageChip ? file.name : undefined}
                >
                  {file.thumbSrc ? (
                    <span
                      className={panelStyles.contextChipThumb}
                      style={{ backgroundImage: `url(${file.thumbSrc})` }}
                      aria-hidden
                    />
                  ) : null}
                  {!isImageChip ? (
                    <>
                      <p className={panelStyles.contextChipName}>{file.name}</p>
                      <div className={panelStyles.contextChipFooter}>
                        <File
                          className={panelStyles.contextChipKindIcon}
                          size={14}
                          weight="regular"
                          aria-hidden
                        />
                        <span className={panelStyles.contextChipBadge}>{file.typeBadge}</span>
                      </div>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className={panelStyles.contextChipRemove}
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(file.id)}
                  >
                    <X size={12} weight="bold" aria-hidden />
                  </button>
                </div>
              )
            })}
          </div>
        ) : null}

        <div className={styles.composeRow}>
          <span
            className={`${styles.orb}${idle ? '' : ` ${styles.orbCollapsed}`}`}
            aria-hidden
          >
            <img className={panelStyles.launcherIcon} src={llumenAssets.launcherOrb} alt="" />
          </span>
          <div
            ref={editorRef}
            className={`${styles.input} ${styles.composerEditor}${
              showPlaceholder ? ` ${styles.composerEditorEmpty}` : ''
            }${idle ? '' : ` ${styles.inputEngaged}`}`}
            contentEditable={!interactionLocked}
            role="textbox"
            aria-multiline="true"
            aria-label="Ask Llumen"
            aria-placeholder={showPlaceholder ? 'Ask Llumen anything…' : undefined}
            data-placeholder={placeholder || undefined}
            suppressContentEditableWarning
            onInput={syncEditor}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && onCollapse && !mentionOpen) {
                e.preventDefault()
                collapse()
                return
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          {onCollapse ? (
            <button
              type="button"
              className={`${styles.collapseBtn}${idle ? '' : ` ${styles.collapseBtnOpposite}`}`}
              aria-label="Minimize to orb"
              disabled={interactionLocked}
              onMouseDown={(e) => e.preventDefault()}
              onClick={collapse}
            >
              <X size={12} weight="bold" aria-hidden />
            </button>
          ) : null}
          {idle ? (
            <div className={styles.composeActions}>
              <button
                type="button"
                className={styles.iconAction}
                aria-label="Past sessions"
                disabled={interactionLocked}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onOpenSessions}
              >
                <ClockCounterClockwise size={18} weight="regular" aria-hidden />
              </button>
              <button
                type="submit"
                className={styles.send}
                disabled={interactionLocked || !canSend}
                aria-label="Send"
              >
                <ArrowUp size={18} weight="regular" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        <div
          className={`${styles.toolbar}${expanded ? '' : ` ${styles.toolbarCollapsed}`}`}
          aria-hidden={!expanded}
        >
          <div className={styles.toolbarLeft}>
            <button
              type="button"
              className={styles.iconAction}
              aria-label="Attach file"
              disabled={interactionLocked || !expanded}
              tabIndex={expanded ? 0 : -1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={addFile}
            >
              <Paperclip size={18} weight="regular" aria-hidden />
            </button>
            <button
              ref={mentionBtnRef}
              type="button"
              className={`${styles.labelAction}${mentionOpen ? ` ${styles.labelActionActive}` : ''}`}
              aria-expanded={mentionOpen}
              aria-haspopup="listbox"
              disabled={interactionLocked || !expanded}
              tabIndex={expanded ? 0 : -1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={openMention}
            >
              <At size={16} weight="regular" aria-hidden />
              Add context
            </button>
          </div>
          {expanded ? (
            <div className={styles.toolbarRight}>
              <button
                type="button"
                className={styles.iconAction}
                aria-label="Past sessions"
                disabled={interactionLocked}
                tabIndex={expanded ? 0 : -1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onOpenSessions}
              >
                <ClockCounterClockwise size={18} weight="regular" aria-hidden />
              </button>
              <button
                type="submit"
                className={styles.send}
                disabled={interactionLocked || !canSend}
                tabIndex={expanded ? 0 : -1}
                aria-label="Send"
              >
                <ArrowUp size={18} weight="regular" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </form>
      {mentionOpen
        ? createPortal(
            <InlineContextMenu
              menuRef={mentionMenuRef}
              position={mentionPos}
              stage={mentionStage}
              categoryId={mentionCategory}
              categories={categories}
              items={items}
              activeIndex={mentionIndex}
              query=""
              onHoverIndex={setMentionIndex}
              onSelectCategory={selectCategory}
              onSelectItem={insertInlineMention}
              onBack={() => {
                setMentionStage('categories')
                setMentionCategory(null)
                setMentionIndex(0)
              }}
            />,
            document.body,
          )
        : null}
    </div>
  )
}
