import {
  At,
  File,
  Microphone,
  Paperclip,
  X,
} from '@phosphor-icons/react'
import gsap from 'gsap'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { llumenAssets } from './assets'
import styles from './compact-assistant.module.css'
import {
  filterCategories,
  filterItems,
  getCategoryIcon,
  type InlineContextCategoryId,
  type InlineContextItem,
} from './inlineContextData'
import { InlineContextMenu, type InlineContextMenuStage } from './InlineContextMenu'
import type { SendVisualState } from './SendButton'
import { SendButton } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

/** Matches reference LlumenChatInput textarea max-height */
const MAX_COMPOSER_PX = 120
const COMPOSER_HEIGHT_DURATION = 0.38
const COMPOSER_HEIGHT_EASE = 'power2.inOut'

type ComposerContext = {
  id: string
  kind: 'file'
  name: string
  typeBadge: string
  thumbSrc?: string
}

const FILE_SAMPLES: Omit<ComposerContext, 'id'>[] = [
  { kind: 'file', name: 'appverifUI.dll', typeBadge: 'DLL' },
  {
    kind: 'file',
    name: 'abu-dhabi-aqi.png',
    typeBadge: 'PNG',
    thumbSrc: llumenAssets.mapAbuDhabiAqi,
  },
  { kind: 'file', name: 'station-export.csv', typeBadge: 'CSV' },
  { kind: 'file', name: 'ops-notes.pdf', typeBadge: 'PDF' },
]

type MentionMenuPosition = {
  left: number
  bottom: number
}

type MentionMenuState = {
  stage: InlineContextMenuStage
  categoryId: InlineContextCategoryId | null
  query: string
  activeIndex: number
  triggerLength: number
  position: MentionMenuPosition
}

function serializeComposer(root: HTMLElement): string {
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

function getMentionTrigger(editor: HTMLElement): { query: string; triggerLength: number } | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.startContainer)) return null

  const anchorEl =
    range.startContainer.nodeType === Node.ELEMENT_NODE
      ? (range.startContainer as Element)
      : range.startContainer.parentElement
  if (anchorEl?.closest('[data-inline-mention]')) return null

  const pre = document.createRange()
  pre.selectNodeContents(editor)
  pre.setEnd(range.startContainer, range.startOffset)
  const textBefore = pre.toString().replace(/\u00a0/g, ' ')
  const match = textBefore.match(/@([^\s@]*)$/)
  if (!match) return null
  return { query: match[1], triggerLength: match[0].length }
}

function getCaretMenuPosition(editor: HTMLElement): MentionMenuPosition {
  const sel = window.getSelection()
  let top = 0
  let left = 0
  if (sel && sel.rangeCount) {
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width || rect.height || rect.top || rect.left) {
      top = rect.top
      left = rect.left
    }
  }
  if (!top && !left) {
    const rect = editor.getBoundingClientRect()
    top = rect.top
    left = rect.left + 12
  }
  return {
    left: Math.max(12, Math.min(left, window.innerWidth - 300)),
    bottom: window.innerHeight - top + 8,
  }
}

function deleteTriggerBeforeCaret(triggerLength: number): Range | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  const range = sel.getRangeAt(0)
  if (range.startContainer.nodeType !== Node.TEXT_NODE) return null
  const textNode = range.startContainer as Text
  const end = range.startOffset
  const start = Math.max(0, end - triggerLength)
  if (textNode.data.slice(start, end).length !== end - start) return null
  const del = document.createRange()
  del.setStart(textNode, start)
  del.setEnd(textNode, end)
  del.deleteContents()
  return del
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

function insertTextAtCaret(editor: HTMLElement, text: string) {
  ensureCaretInEditor(editor)
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return
  const range = sel.getRangeAt(0)
  range.deleteContents()
  const node = document.createTextNode(text)
  range.insertNode(node)
  range.setStart(node, node.data.length)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

function createMentionChip(item: InlineContextItem): HTMLSpanElement {
  const Icon = getCategoryIcon(item.categoryId)
  const chip = document.createElement('span')
  chip.className = styles.inlineMention
  chip.contentEditable = 'false'
  chip.dataset.inlineMention = item.id
  chip.dataset.mentionName = item.name
  chip.dataset.mentionCategory = item.categoryId

  const iconHost = document.createElement('span')
  iconHost.className = styles.inlineMentionIcon
  iconHost.setAttribute('aria-hidden', 'true')
  iconHost.innerHTML = renderToStaticMarkup(<Icon size={12} weight="bold" />)

  const label = document.createElement('span')
  label.className = styles.inlineMentionLabel
  label.textContent = item.name

  chip.append(iconHost, label)
  return chip
}

function mentionFromNode(node: Node | null): HTMLElement | null {
  if (!node) return null
  if (node instanceof HTMLElement && node.dataset.inlineMention != null) return node
  const parent = node.parentElement
  return parent?.closest('[data-inline-mention]') ?? null
}

function placeCaretAt(node: Node, offset: number) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

function removeMentionChips(chips: HTMLElement[]) {
  if (chips.length === 0) return
  const first = chips[0]
  const parent = first.parentNode
  const index = parent ? Array.from(parent.childNodes).indexOf(first) : -1
  for (const chip of chips) chip.remove()
  if (parent && index >= 0) {
    placeCaretAt(parent, Math.min(index, parent.childNodes.length))
  }
}

/** Delete selected / adjacent contentEditable=false mention chips (browser won't). */
function tryDeleteMentionChips(editor: HTMLElement, key: 'Backspace' | 'Delete'): boolean {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !editor.contains(sel.anchorNode)) return false
  const range = sel.getRangeAt(0)

  if (!sel.isCollapsed) {
    const selected = new Set<HTMLElement>()
    editor.querySelectorAll<HTMLElement>('[data-inline-mention]').forEach((chip) => {
      if (range.intersectsNode(chip)) selected.add(chip)
    })
    const startMention = mentionFromNode(range.startContainer)
    const endMention = mentionFromNode(range.endContainer)
    if (startMention) selected.add(startMention)
    if (endMention) selected.add(endMention)
    if (selected.size === 0) return false
    removeMentionChips([...selected])
    return true
  }

  const { startContainer: node, startOffset: offset } = range

  if (key === 'Backspace') {
    if (node.nodeType === Node.TEXT_NODE && offset === 0) {
      const prev = node.previousSibling
      if (prev instanceof HTMLElement && prev.dataset.inlineMention != null) {
        removeMentionChips([prev])
        return true
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
      const prev = node.childNodes[offset - 1]
      if (prev instanceof HTMLElement && prev.dataset.inlineMention != null) {
        removeMentionChips([prev])
        return true
      }
    }
    // Caret sitting on/inside a selected chip
    const mention = mentionFromNode(node)
    if (mention && (node === mention || mention.contains(node))) {
      // Only treat as chip delete when the caret collapsed inside the atomic chip
      if (node !== editor && mention.contains(node)) {
        removeMentionChips([mention])
        return true
      }
    }
  }

  if (key === 'Delete') {
    if (node.nodeType === Node.TEXT_NODE && offset === (node.textContent?.length ?? 0)) {
      const next = node.nextSibling
      if (next instanceof HTMLElement && next.dataset.inlineMention != null) {
        removeMentionChips([next])
        return true
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const next = node.childNodes[offset]
      if (next instanceof HTMLElement && next.dataset.inlineMention != null) {
        removeMentionChips([next])
        return true
      }
    }
    const mention = mentionFromNode(node)
    if (mention && node !== editor && mention.contains(node)) {
      removeMentionChips([mention])
      return true
    }
  }

  return false
}

function ContextChip({
  item,
  onRemove,
}: {
  item: ComposerContext
  onRemove: (id: string) => void
}) {
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
            <File className={styles.contextChipKindIcon} size={14} weight="regular" aria-hidden />
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
  const editorRef = useRef<HTMLDivElement>(null)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const composerHeightRef = useRef<number | null>(null)
  const mentionMenuRef = useRef<HTMLDivElement>(null)
  const fileCounterRef = useRef(0)
  const uid = useId()
  const [contexts, setContexts] = useState<ComposerContext[]>([])
  const [mentionMenu, setMentionMenu] = useState<MentionMenuState | null>(null)
  const [editorEmpty, setEditorEmpty] = useState(true)
  const chatScrollRef = useRevealScrollbarOnScroll()

  const filteredCategories = useMemo(
    () => filterCategories(mentionMenu?.query ?? ''),
    [mentionMenu?.query],
  )
  const filteredItems = useMemo(() => {
    if (!mentionMenu?.categoryId) return []
    return filterItems(mentionMenu.categoryId, mentionMenu.query)
  }, [mentionMenu?.categoryId, mentionMenu?.query])

  const syncComposerReserve = useCallback((heightPx: number) => {
    const el = chatBoxRef.current
    const middle = el?.parentElement
    if (!middle) return
    middle.style.setProperty('--lc-composer-reserve', `${Math.ceil(heightPx)}px`)
  }, [])

  const syncEditorHeight = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_PX)}px`
  }, [])

  const emitChange = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    setEditorEmpty(editorIsEmpty(el))
    onChange(serializeComposer(el))
    syncEditorHeight()
  }, [onChange, syncEditorHeight])

  const closeMentionMenu = useCallback(() => {
    setMentionMenu(null)
  }, [])

  const editorDisabled = disabled || sendState === 'stop'

  const refreshMentionMenu = useCallback(() => {
    const editor = editorRef.current
    if (!editor) {
      setMentionMenu(null)
      return
    }
    const trigger = getMentionTrigger(editor)
    if (!trigger) {
      setMentionMenu(null)
      return
    }
    setMentionMenu((prev) => {
      const stage = prev?.stage ?? 'categories'
      const categoryId = stage === 'items' ? prev?.categoryId ?? null : null
      const listLength =
        stage === 'items' && categoryId
          ? filterItems(categoryId, trigger.query).length
          : filterCategories(trigger.query).length
      return {
        stage: categoryId ? 'items' : 'categories',
        categoryId,
        query: trigger.query,
        triggerLength: trigger.triggerLength,
        activeIndex: Math.min(prev?.activeIndex ?? 0, Math.max(0, listLength - 1)),
        position: getCaretMenuPosition(editor),
      }
    })
  }, [])

  const insertMention = useCallback(
    (item: InlineContextItem) => {
      const editor = editorRef.current
      if (!editor || !mentionMenu) return
      editor.focus()
      const del = deleteTriggerBeforeCaret(mentionMenu.triggerLength)
      if (!del) {
        closeMentionMenu()
        return
      }

      const chip = createMentionChip(item)
      del.insertNode(chip)
      const space = document.createTextNode('\u00a0')
      chip.after(space)

      const sel = window.getSelection()
      if (sel) {
        const after = document.createRange()
        after.setStart(space, space.data.length)
        after.collapse(true)
        sel.removeAllRanges()
        sel.addRange(after)
      }

      closeMentionMenu()
      emitChange()
    },
    [closeMentionMenu, emitChange, mentionMenu],
  )

  const selectCategory = useCallback(
    (categoryId: InlineContextCategoryId) => {
      const editor = editorRef.current
      const prev = mentionMenu
      if (!prev || !editor) {
        setMentionMenu((m) =>
          m
            ? {
                ...m,
                stage: 'items',
                categoryId,
                query: '',
                triggerLength: 1,
                activeIndex: 0,
              }
            : m,
        )
        return
      }

      editor.focus()
      if (prev.query.length > 0) {
        const del = deleteTriggerBeforeCaret(prev.triggerLength)
        if (del) {
          const at = document.createTextNode('@')
          del.insertNode(at)
          const sel = window.getSelection()
          if (sel) {
            const after = document.createRange()
            after.setStart(at, 1)
            after.collapse(true)
            sel.removeAllRanges()
            sel.addRange(after)
          }
          emitChange()
        }
      }

      setMentionMenu({
        stage: 'items',
        categoryId,
        query: '',
        triggerLength: 1,
        activeIndex: 0,
        position: getCaretMenuPosition(editor),
      })
    },
    [emitChange, mentionMenu],
  )

  const openContextMentionPicker = useCallback(() => {
    if (editorDisabled) return
    const editor = editorRef.current
    if (!editor) return
    ensureCaretInEditor(editor)
    const existing = getMentionTrigger(editor)
    if (!existing) {
      insertTextAtCaret(editor, '@')
      emitChange()
    }
    requestAnimationFrame(refreshMentionMenu)
  }, [editorDisabled, emitChange, refreshMentionMenu])

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (value === '' && !editorIsEmpty(el)) {
      el.innerHTML = ''
      setEditorEmpty(true)
      closeMentionMenu()
      syncEditorHeight()
    }
  }, [value, closeMentionMenu, syncEditorHeight])

  useEffect(() => {
    syncEditorHeight()
  }, [value, syncEditorHeight])

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
  }, [contexts, value, syncComposerReserve])

  useEffect(() => {
    if (!mentionMenu) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (editorRef.current?.contains(target) || mentionMenuRef.current?.contains(target)) return
      closeMentionMenu()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [mentionMenu, closeMentionMenu])

  const onEditorInput = (_e: FormEvent<HTMLDivElement>) => {
    emitChange()
    refreshMentionMenu()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const editor = editorRef.current
      if (editor && tryDeleteMentionChips(editor, e.key)) {
        e.preventDefault()
        emitChange()
        refreshMentionMenu()
        return
      }
    }

    if (mentionMenu) {
      const listLength =
        mentionMenu.stage === 'categories' ? filteredCategories.length : filteredItems.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (listLength === 0) return
        setMentionMenu((prev) =>
          prev ? { ...prev, activeIndex: (prev.activeIndex + 1) % listLength } : prev,
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (listLength === 0) return
        setMentionMenu((prev) =>
          prev
            ? { ...prev, activeIndex: (prev.activeIndex - 1 + listLength) % listLength }
            : prev,
        )
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (mentionMenu.stage === 'items') {
          setMentionMenu((prev) =>
            prev
              ? {
                  ...prev,
                  stage: 'categories',
                  categoryId: null,
                  activeIndex: 0,
                }
              : prev,
          )
        } else {
          closeMentionMenu()
        }
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (listLength === 0) return
        if (mentionMenu.stage === 'categories') {
          const cat = filteredCategories[mentionMenu.activeIndex]
          if (cat) selectCategory(cat.id)
        } else {
          const item = filteredItems[mentionMenu.activeIndex]
          if (item) insertMention(item)
        }
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (sendState === 'stop') return
      if (sendState === 'active') onSend()
    }
  }

  const addFileAttachment = () => {
    if (!showParameters || editorDisabled) return
    const index = fileCounterRef.current % FILE_SAMPLES.length
    fileCounterRef.current += 1
    const sample = FILE_SAMPLES[index]
    setContexts((prev) => [
      ...prev,
      {
        ...sample,
        id: `${uid}-file-${fileCounterRef.current}`,
      },
    ])
    onAttachClick?.()
  }

  const removeContext = (id: string) => {
    setContexts((prev) => prev.filter((item) => item.id !== id))
  }

  const hasContexts = contexts.length > 0
  const placeholder = hasThreadMessages ? 'Reply...' : 'Ask about anything'

  return (
    <div
      ref={chatBoxRef}
      className={`${styles.chatBox}${hasContexts ? ` ${styles.chatBoxWithContexts}` : ''}`}
      data-lc-composer=""
    >
      {hasContexts ? (
        <div className={styles.contextChipRow} aria-label="Attached files">
          {contexts.map((item) => (
            <ContextChip key={item.id} item={item} onRemove={removeContext} />
          ))}
        </div>
      ) : null}
      <div className={styles.textAreaWrap}>
        <div
          ref={(el) => {
            editorRef.current = el
            chatScrollRef(el)
          }}
          className={`${styles.textArea} ${styles.composerEditor}${
            editorEmpty ? ` ${styles.composerEditorEmpty}` : ''
          }`}
          contentEditable={!editorDisabled}
          role="textbox"
          aria-multiline="true"
          aria-label={hasThreadMessages ? 'Reply' : 'Message'}
          aria-placeholder={placeholder}
          data-placeholder={placeholder}
          data-lc-composer-editor=""
          suppressContentEditableWarning
          onInput={onEditorInput}
          onKeyDown={onKeyDown}
          onClick={() => {
            requestAnimationFrame(refreshMentionMenu)
          }}
          onKeyUp={() => {
            if (!mentionMenu) requestAnimationFrame(refreshMentionMenu)
          }}
        />
      </div>
      <div className={styles.paramsCol}>
        <div className={styles.rowPrimary}>
          <div className={styles.rowPrimaryLeft}>
            {showParameters && (
              <>
                {mentionMenu &&
                  createPortal(
                    <InlineContextMenu
                      menuRef={mentionMenuRef}
                      position={mentionMenu.position}
                      stage={mentionMenu.stage}
                      categoryId={mentionMenu.categoryId}
                      categories={filteredCategories}
                      items={filteredItems}
                      activeIndex={mentionMenu.activeIndex}
                      query={mentionMenu.query}
                      onHoverIndex={(index) =>
                        setMentionMenu((prev) => (prev ? { ...prev, activeIndex: index } : prev))
                      }
                      onSelectCategory={selectCategory}
                      onSelectItem={insertMention}
                      onBack={() =>
                        setMentionMenu((prev) =>
                          prev
                            ? {
                                ...prev,
                                stage: 'categories',
                                categoryId: null,
                                activeIndex: 0,
                              }
                            : prev,
                        )
                      }
                    />,
                    document.body,
                  )}
                <button
                  type="button"
                  className={styles.contextBtn}
                  aria-label="Attach file"
                  onClick={addFileAttachment}
                  disabled={editorDisabled}
                >
                  <Paperclip className={styles.contextBtnIcon} size={18} weight="regular" aria-hidden />
                </button>
                <button
                  type="button"
                  className={`${styles.contextBtn}${mentionMenu ? ` ${styles.contextBtnActive}` : ''}`}
                  aria-label="Add context mention"
                  aria-expanded={Boolean(mentionMenu)}
                  aria-haspopup="listbox"
                  onClick={openContextMentionPicker}
                  disabled={editorDisabled}
                >
                  <At className={styles.contextBtnIcon} size={18} weight="regular" aria-hidden />
                </button>
              </>
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
