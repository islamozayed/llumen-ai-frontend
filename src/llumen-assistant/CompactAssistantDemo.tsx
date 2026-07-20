/**
 * Llumen compact assistant demo — air-quality conversation flow.
 * Integration: theme tokens in src/styles/tokens.css; icons in public/llumen-assets/*.svg.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import { MeshGradient } from '@paper-design/shaders-react'
import gsap from 'gsap'
import styles from './compact-assistant.module.css'
import LandingHomeDefault from './landing/LandingHomeDefault'
import { MESH_COLORS_DEMO_PAGE, MESH_FRAME_DEMO_PAGE } from './paperMeshConstants'
import { AssistantHero } from './AssistantHero'
import { AssistantLauncher } from './AssistantLauncher'
import { AssistantPanel } from './AssistantPanel'
import { ChatComposer } from './ChatComposer'
import { PanelHeader } from './PanelHeader'
import type { ChatQuestionIndexItem } from './PanelHeader'
import { SessionsPanel, DEMO_SESSION_ID } from './SessionsPanel'
import { ShareModal } from './ShareModal'
import { splitTextWithInlineMentions, getCategoryIcon } from './inlineContextData'
import type {
  AgentResponseBlock,
  AssistantReplyPayload,
  CreatedComponent,
  SubcontextState,
} from './assistantReplyTypes'
import { AssistantTimelineReply } from './AssistantTimelineReply'
import { ComponentDetailPanel } from './ComponentDetailPanel'
import { SlidesDetailPanel } from './SlidesDetailPanel'
import {
  AIR_QUALITY_COMPONENTS,
  AIR_QUALITY_REPORT,
  TURN1_REPLY,
  TURN2_REPLY,
  detectConversationTurn,
  findComponent,
  findReport,
  replyForTurn,
} from './airQualityConversationDemo'
import type { SendVisualState } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'
import { useStickToBottomScroll } from './useStickToBottomScroll'

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; reply?: AssistantReplyPayload }

const SUBCONTEXT_EXIT_MS = 280

/** Design-capture presets via `?preview=<name>` (used for Figma handoff). */
type FigmaPreviewMode =
  | 'empty'
  | 'conversation'
  | 'sessions'
  | 'fullscreen'
  | 'fullscreen-sessions'
  | 'detail'

function readFigmaPreviewMode(): FigmaPreviewMode | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('preview')
  switch (value) {
    case 'empty':
    case 'conversation':
    case 'sessions':
    case 'fullscreen':
    case 'fullscreen-sessions':
    case 'detail':
      return value
    default:
      return null
  }
}

function buildTurn1Seed(): ChatMessage[] {
  return [
    {
      id: 'demo-u1',
      role: 'user',
      text: 'What is driving the deterioration in air quality, where is it concentrated, and who may be exposed?',
    },
    {
      id: 'demo-a1',
      role: 'assistant',
      text: '',
      reply: TURN1_REPLY,
    },
  ]
}

function buildConversationSeed(): ChatMessage[] {
  return [
    {
      id: 'preview-u1',
      role: 'user',
      text: 'What is driving the deterioration in air quality, where is it concentrated, and who may be exposed?',
    },
    {
      id: 'preview-a1',
      role: 'assistant',
      text: '',
      reply: TURN1_REPLY,
    },
    {
      id: 'preview-u2',
      role: 'user',
      text: 'Are elevated NO₂ and PM₂.₅ more consistent with traffic or industrial activity?',
    },
    {
      id: 'preview-a2',
      role: 'assistant',
      text: '',
      reply: TURN2_REPLY,
    },
  ]
}

const SESSIONS_SIDEBAR_BREAKPOINT_PX = 1536

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function truncateTitle(text: string, max = 52) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  const slice = cleaned.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(' ')
  return `${(lastSpace > 24 ? slice.slice(0, lastSpace) : slice).trim()}…`
}

function titleFromReply(reply: AssistantReplyPayload) {
  if (reply.headline?.trim()) return truncateTitle(reply.headline)
  const firstText = reply.blocks?.find((b) => b.type === 'text')
  if (firstText?.type === 'text' && firstText.content.trim()) return truncateTitle(firstText.content)
  if (reply.confirmation?.trim()) return truncateTitle(reply.confirmation)
  return 'New chat'
}

function UserMessageBubble({
  messageId,
  text,
  questions,
  onJumpToQuestion,
}: {
  messageId: string
  text: string
  questions: ChatQuestionIndexItem[]
  onJumpToQuestion: (questionId: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const showJump = questions.length > 1

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div data-message-id={messageId} className={styles.msgUserRow}>
      <div className={styles.msgUser}>
        <span className={styles.msgUserText}>
          {splitTextWithInlineMentions(text).map((segment, index) => {
            if (segment.type !== 'mention') {
              return <span key={`t-${index}`}>{segment.value}</span>
            }
            const Icon = getCategoryIcon(segment.categoryId)
            return (
              <span key={`m-${index}`} className={styles.inlineMention}>
                <Icon className={styles.inlineMentionIcon} size={12} weight="bold" aria-hidden />
                <span className={styles.inlineMentionLabel}>{segment.name}</span>
              </span>
            )
          })}
        </span>
        {showJump ? (
          <div className={styles.msgUserJumpWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.msgUserJumpBtn}
              aria-label="Jump to another message"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <CaretDown size={14} weight="bold" aria-hidden />
            </button>
            {menuOpen ? (
              <div className={styles.msgUserJumpMenu} role="menu" aria-label="Your messages in this chat">
                {questions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={`${styles.msgUserJumpItem}${
                      item.id === messageId ? ` ${styles.msgUserJumpItemActive}` : ''
                    }`}
                    onClick={() => {
                      onJumpToQuestion(item.id)
                      setMenuOpen(false)
                    }}
                  >
                    <span className={styles.msgUserJumpItemNum}>{index + 1}</span>
                    <span className={styles.msgUserJumpItemText}>{item.question}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CompactAssistantDemo() {
  const previewMode = useMemo(() => readFigmaPreviewMode(), [])
  const previewForceInstant = previewMode != null
  const [open, setOpen] = useState(() => previewMode != null)
  const [expanded, setExpanded] = useState(
    () => previewMode === 'fullscreen' || previewMode === 'fullscreen-sessions',
  )
  const [draft, setDraft] = useState('')
  const [subcontext, setSubcontext] = useState<SubcontextState>(() =>
    previewMode === 'detail'
      ? { view: 'map', componentId: 'air-quality-monitoring-map' }
      : { view: 'closed' },
  )
  const [subcontextClosing, setSubcontextClosing] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(
    () => previewMode === 'sessions' || previewMode === 'fullscreen-sessions',
  )
  const [shareOpen, setShareOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    previewMode === 'conversation' ||
    previewMode === 'sessions' ||
    previewMode === 'fullscreen' ||
    previewMode === 'fullscreen-sessions' ||
    previewMode === 'detail'
      ? buildConversationSeed()
      : [],
  )
  const [streaming, setStreaming] = useState(false)
  const [replyRendering, setReplyRendering] = useState(false)
  const [chatTitle, setChatTitle] = useState(() =>
    previewMode && previewMode !== 'empty' ? 'Air quality corridor review' : 'New chat',
  )
  const titleEditedRef = useRef(false)
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const assistantMsgId = useRef<string | null>(null)
  const assistantPanelRef = useRef<HTMLDivElement>(null)
  const subcontextCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fabColumnRef = useRef<HTMLDivElement>(null)
  const chatMiddleRef = useRef<HTMLDivElement>(null)
  const pendingPanelAnimRef = useRef<{ width: number; height: number; top: number; left: number } | null>(
    null,
  )
  const revealSessionsAfterExpandRef = useRef(false)
  const subcontextViewRef = useRef(subcontext.view)
  subcontextViewRef.current = subcontext.view
  const transcriptRevealRef = useRevealScrollbarOnScroll()
  const transcriptContentKey = `${messages.length}:${streaming ? '1' : '0'}`
  const { ref: transcriptStickRef, releaseStick } = useStickToBottomScroll(transcriptContentKey)
  const transcriptElRef = useRef<HTMLDivElement | null>(null)

  const syncTranscriptScrollbarInset = useCallback(() => {
    const middle = chatMiddleRef.current
    const transcript = transcriptElRef.current
    if (!middle) return
    const tokenPx =
      Number.parseFloat(getComputedStyle(middle).getPropertyValue('--lc-scrollbar-size')) || 4
    if (!transcript) {
      middle.style.setProperty('--lc-transcript-scrollbar-inset', `${tokenPx}px`)
      return
    }
    const measured = Math.max(0, transcript.offsetWidth - transcript.clientWidth)
    // Always reserve at least the token width so empty → first-message doesn't shift
    middle.style.setProperty(
      '--lc-transcript-scrollbar-inset',
      `${Math.max(measured, tokenPx)}px`,
    )
  }, [])

  const transcriptScrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      transcriptElRef.current = el
      transcriptRevealRef(el)
      transcriptStickRef(el)
      syncTranscriptScrollbarInset()
    },
    [transcriptRevealRef, transcriptStickRef, syncTranscriptScrollbarInset],
  )

  useEffect(() => {
    const transcript = transcriptElRef.current
    syncTranscriptScrollbarInset()
    if (!transcript) return
    const ro = new ResizeObserver(() => syncTranscriptScrollbarInset())
    ro.observe(transcript)
    window.addEventListener('resize', syncTranscriptScrollbarInset)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', syncTranscriptScrollbarInset)
    }
  }, [syncTranscriptScrollbarInset, transcriptContentKey])

  useLayoutEffect(() => {
    const start = pendingPanelAnimRef.current
    if (!start) return
    pendingPanelAnimRef.current = null
    const el = assistantPanelRef.current
    if (!el) return

    const vw = window.innerWidth
    const vh = window.innerHeight

    gsap.killTweensOf(el)

    if (expanded) {
      const end = { top: 0, left: 0, width: vw, height: vh }
      gsap.set(el, {
        position: 'fixed',
        top: start.top,
        left: start.left,
        width: start.width,
        height: start.height,
        margin: 0,
        right: 'auto',
        bottom: 'auto',
      })
      const tween = gsap.to(el, {
        top: end.top,
        left: end.left,
        width: end.width,
        height: end.height,
        duration: 0.62,
        ease: 'power3.inOut',
        onComplete: () => {
          gsap.set(el, { clearProps: 'top,left,width,height,margin,right,bottom,position' })
          if (revealSessionsAfterExpandRef.current && subcontextViewRef.current === 'closed') {
            setSessionsOpen(true)
          }
          revealSessionsAfterExpandRef.current = false
        },
      })
      return () => {
        tween.kill()
        gsap.set(el, { clearProps: 'top,left,width,height,margin,right,bottom,position' })
      }
    }

    const endRect = el.getBoundingClientRect()
    gsap.set(el, {
      position: 'fixed',
      top: start.top,
      left: start.left,
      width: start.width,
      height: start.height,
      margin: 0,
      right: 'auto',
      bottom: 'auto',
    })
    const tween = gsap.to(el, {
      top: endRect.top,
      left: endRect.left,
      width: endRect.width,
      height: endRect.height,
      duration: 0.62,
      ease: 'power3.inOut',
      onComplete: () => {
        gsap.set(el, { clearProps: 'top,left,width,height,margin,right,bottom,position' })
      },
    })
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'top,left,width,height,margin,right,bottom,position' })
    }
  }, [expanded])

  const clearStream = useCallback(() => {
    if (streamTimer.current) {
      clearTimeout(streamTimer.current)
      streamTimer.current = null
    }
    assistantMsgId.current = null
    setStreaming(false)
    setReplyRendering(false)
  }, [])

  useEffect(() => {
    return () => clearStream()
  }, [clearStream])

  const openSubcontext = useCallback((next: SubcontextState) => {
    if (subcontextCloseTimerRef.current != null) {
      clearTimeout(subcontextCloseTimerRef.current)
      subcontextCloseTimerRef.current = null
    }
    setSubcontextClosing(false)
    setSubcontext(next)
  }, [])

  const closeSubcontext = useCallback(() => {
    if (subcontext.view === 'closed' || subcontextCloseTimerRef.current != null) return
    setSubcontextClosing(true)
    subcontextCloseTimerRef.current = setTimeout(() => {
      subcontextCloseTimerRef.current = null
      setSubcontext({ view: 'closed' })
      setSubcontextClosing(false)
    }, SUBCONTEXT_EXIT_MS)
  }, [subcontext.view])

  const closeSubcontextImmediately = useCallback(() => {
    if (subcontextCloseTimerRef.current != null) {
      clearTimeout(subcontextCloseTimerRef.current)
      subcontextCloseTimerRef.current = null
    }
    setSubcontextClosing(false)
    setSubcontext({ view: 'closed' })
  }, [])

  useEffect(() => {
    return () => {
      if (subcontextCloseTimerRef.current != null) clearTimeout(subcontextCloseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (subcontext.view !== 'closed') setSessionsOpen(false)
  }, [subcontext.view])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shareOpen) return
        e.preventDefault()
        if (subcontext.view !== 'closed') {
          closeSubcontext()
          return
        }
        if (sessionsOpen) {
          setSessionsOpen(false)
          return
        }
        if (expanded) {
          const el = assistantPanelRef.current
          if (el) {
            const rect = el.getBoundingClientRect()
            pendingPanelAnimRef.current = {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }
          }
          setExpanded(false)
          return
        }
        setOpen(false)
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, subcontext.view, closeSubcontext, expanded, sessionsOpen, shareOpen])

  const startAssistantReply = useCallback((reply: AssistantReplyPayload) => {
    const aid = uid()
    assistantMsgId.current = aid
    setMessages((m) => [...m, { id: aid, role: 'assistant', text: '', reply }])
    setStreaming(true)
    setReplyRendering(true)

    const thinkingMs = Math.max(1800, (reply.timeline.length || 1) * 1100)
    streamTimer.current = setTimeout(() => {
      streamTimer.current = null
      assistantMsgId.current = null
      setStreaming(false)
    }, thinkingMs)
  }, [])

  const send = useCallback(() => {
    const t = draft.trim()
    if (!t || streaming) return
    setDraft('')
    const priorAssistant = messages.filter((msg) => msg.role === 'assistant').length
    const turn = detectConversationTurn(t, priorAssistant)
    const reply = replyForTurn(turn)
    if (!titleEditedRef.current && priorAssistant === 0) {
      setChatTitle(titleFromReply(reply))
    }
    setMessages((m) => [...m, { id: uid(), role: 'user', text: t }])
    startAssistantReply(reply)
  }, [draft, streaming, messages, startAssistantReply])

  const questionIndex = useMemo((): ChatQuestionIndexItem[] => {
    const items: ChatQuestionIndexItem[] = []
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg.role !== 'user') continue
      items.push({
        id: msg.id,
        question: msg.text,
        responseId: msg.id,
      })
    }
    return items
  }, [messages])

  const toggleExpanded = useCallback(() => {
    const nextExpanded = !expanded
    const el = assistantPanelRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      pendingPanelAnimRef.current = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
    }
    revealSessionsAfterExpandRef.current = nextExpanded && subcontext.view === 'closed'
    setSessionsOpen(false)
    setExpanded(nextExpanded)
  }, [expanded, subcontext.view])

  const jumpToQuestion = useCallback((questionId: string) => {
    releaseStick()
    const root = chatMiddleRef.current
    const target = root?.querySelector(`[data-message-id="${CSS.escape(questionId)}"]`)
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [releaseStick])

  const showInConversation = useCallback((target: { componentId?: string; reportId?: string }) => {
    releaseStick()
    const root = chatMiddleRef.current
    if (!root) return
    const selector = target.componentId
      ? `[data-component-id="${CSS.escape(target.componentId)}"]`
      : target.reportId
        ? `[data-report-id="${CSS.escape(target.reportId)}"]`
        : null
    if (!selector) return
    const el = root.querySelector(selector)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [releaseStick])

  const onChatTitleChange = useCallback((title: string) => {
    titleEditedRef.current = true
    setChatTitle(title)
  }, [])

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  const selectedComponent = useMemo((): CreatedComponent | null => {
    if (subcontext.view !== 'map' && subcontext.view !== 'chart') return null
    return findComponent(subcontext.componentId) ?? null
  }, [subcontext])

  const activeReport = useMemo(() => {
    if (subcontext.view !== 'slides') return null
    return findReport(subcontext.reportId) ?? AIR_QUALITY_REPORT
  }, [subcontext])

  const handleSessionsOpenChange = useCallback(
    (nextOpen: boolean) => {
      setSessionsOpen(nextOpen)
      if (
        nextOpen &&
        expanded &&
        subcontext.view !== 'closed' &&
        window.innerWidth < SESSIONS_SIDEBAR_BREAKPOINT_PX
      ) {
        closeSubcontext()
      }
    },
    [expanded, subcontext.view, closeSubcontext],
  )

  const splitOpen = subcontext.view !== 'closed'

  const onComponentSelect = useCallback((component: CreatedComponent) => {
    if (streaming) return
    const isMap = component.preview?.kind === 'image' && component.preview.detailView === 'map'
    openSubcontext({
      view: isMap ? 'map' : 'chart',
      componentId: component.id,
    })
  }, [streaming, openSubcontext])

  const onReportOpen = useCallback((reportId: string) => {
    setSessionsOpen(false)
    openSubcontext({ view: 'slides', reportId, activeSlide: 0 })
  }, [openSubcontext])

  const onOpenSubcontext = useCallback((block: AgentResponseBlock) => {
    if (block.type === 'visual' && block.openSubcontext) {
      openSubcontext({
        view: block.visualType === 'map' ? 'map' : 'chart',
        componentId: block.componentId,
      })
      return
    }
    if (block.type === 'report' && block.openSubcontext) {
      setSessionsOpen(false)
      openSubcontext({ view: 'slides', reportId: block.reportId, activeSlide: 0 })
    }
  }, [openSubcontext])

  const stop = useCallback(() => {
    clearStream()
  }, [clearStream])

  const onReplyComplete = useCallback(() => {
    setReplyRendering(false)
  }, [])

  const sendVisual: SendVisualState = streaming ? 'stop' : draft.trim() ? 'active' : 'inactive'

  const resetConversation = useCallback(() => {
    clearStream()
    setMessages([])
    setDraft('')
    closeSubcontextImmediately()
    setChatTitle('New chat')
    titleEditedRef.current = false
  }, [clearStream, closeSubcontextImmediately])

  const loadDemoSession = useCallback(() => {
    clearStream()
    setMessages(buildTurn1Seed())
    setDraft('')
    closeSubcontextImmediately()
    setChatTitle('Air quality corridor review')
    titleEditedRef.current = true
  }, [clearStream, closeSubcontextImmediately])

  const openSession = useCallback(
    (id: string) => {
      if (id === DEMO_SESSION_ID) {
        loadDemoSession()
        return
      }
      resetConversation()
    },
    [loadDemoSession, resetConversation],
  )

  const closePanel = useCallback(() => {
    setOpen(false)
    setExpanded(false)
    closeSubcontextImmediately()
    setSessionsOpen(false)
    clearStream()
    setMessages([])
    setDraft('')
    setChatTitle('New chat')
    titleEditedRef.current = false
  }, [clearStream, closeSubcontextImmediately])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (fabColumnRef.current?.contains(target)) return
      // Thinking popover / attach menu are portaled to document.body — don't treat as outside-click.
      if (target instanceof Element && target.closest('[data-lc-thinking-popover]')) return
      if (target instanceof Element && target.closest('[data-lc-attach-menu]')) return
      if (target instanceof Element && target.closest('[data-lc-inline-context-menu]')) return
      if (target instanceof Element && target.closest('[data-lc-conversation-menu]')) return
      if (target instanceof Element && target.closest('[data-lc-share-modal]')) return
      closePanel()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, closePanel])

  const openLauncher = useCallback(() => {
    setOpen(true)
  }, [])

  const isNewChat = messages.length === 0
  const hasAssistantReply = messages.some((m) => m.role === 'assistant')

  /** Pair each user message with the following assistant reply. */
  const turns = useMemo(() => {
    const grouped: {
      user: Extract<ChatMessage, { role: 'user' }>
      assistant?: Extract<ChatMessage, { role: 'assistant' }>
    }[] = []
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg.role !== 'user') {
        if (msg.role === 'assistant' && grouped.length === 0) {
          grouped.push({
            user: { id: `orphan-${msg.id}`, role: 'user', text: '' },
            assistant: msg,
          })
        }
        continue
      }
      const next = messages[i + 1]
      const assistant = next?.role === 'assistant' ? next : undefined
      if (assistant) i += 1
      grouped.push({ user: msg, assistant })
    }
    return grouped
  }, [messages])

  const chatMiddle = (
    <div ref={chatMiddleRef} className={`${styles.middle} ${isNewChat ? styles.middleEmpty : ''}`}>
      {isNewChat ? (
        <AssistantHero />
      ) : (
        <div ref={transcriptScrollRef} className={styles.transcript}>
          {turns.map(({ user, assistant }) => (
            <div key={user.id} className={styles.msgTurn}>
              {user.text ? (
                <UserMessageBubble
                  messageId={user.id}
                  text={user.text}
                  questions={questionIndex}
                  onJumpToQuestion={jumpToQuestion}
                />
              ) : null}
              {assistant?.reply ? (
                <div data-message-id={assistant.id} className={styles.msgAssistantTimeline}>
                  <AssistantTimelineReply
                    key={assistant.id}
                    reply={assistant.reply}
                    streamingText={assistant.text}
                    isAnswerStreaming={streaming && assistantMsgId.current === assistant.id}
                    onComponentSelect={onComponentSelect}
                    onReportOpen={onReportOpen}
                    onOpenSubcontext={onOpenSubcontext}
                    onReplyComplete={onReplyComplete}
                    selectedComponentId={
                      subcontext.view === 'map' || subcontext.view === 'chart'
                        ? subcontext.componentId
                        : null
                    }
                    instantTimeline={
                      previewForceInstant ||
                      assistant.id !== lastAssistantMessageId ||
                      assistant.id.startsWith('demo-')
                    }
                    conversationPanelRef={chatMiddleRef}
                  />
                </div>
              ) : assistant ? (
                <div data-message-id={assistant.id} className={styles.msgAssistant}>
                  {assistant.text || '\u00a0'}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSend={send}
        onStop={stop}
        sendState={sendVisual}
        showParameters
        onAttachClick={() => {}}
      />
    </div>
  )

  return (
    <div className={styles.demoPage}>
      <div className={styles.demoPageShader} aria-hidden>
        <MeshGradient
          speed={open ? 0 : 0.4}
          scale={1}
          distortion={0.09}
          swirl={0}
          frame={MESH_FRAME_DEMO_PAGE}
          colors={[...MESH_COLORS_DEMO_PAGE]}
          className={styles.demoPageShaderCanvas}
        />
      </div>
      <div className={styles.demoLandingLayer}>
        <LandingHomeDefault />
      </div>
      {open ? <div className={styles.backdrop} aria-hidden /> : null}
      <div
        ref={fabColumnRef}
        className={`${styles.fabColumn}${splitOpen ? ` ${styles.fabColumnSplit}` : ''}`}
      >
        <div
          className={`${styles.panelWrap} ${open ? '' : styles.panelWrapHidden}`}
          aria-hidden={!open}
        >
          {open && (
            <AssistantPanel
              ref={assistantPanelRef}
              expanded={expanded}
              splitView={splitOpen}
              allowOverflow={sessionsOpen && !expanded}
              thinking={replyRendering}
            >
              <div className={styles.splitBody}>
                {expanded && sessionsOpen ? (
                  <aside
                    className={styles.sessionsSidebar}
                    aria-label="Conversations"
                    data-lc-sessions-sidebar
                  >
                    <SessionsPanel
                      variant="fullscreen"
                      onOpenSession={openSession}
                      onShareSession={() => setShareOpen(true)}
                    />
                  </aside>
                ) : null}
                <div className={`${styles.chatColumn} ${splitOpen ? styles.chatColumnSplit : ''}`}>
                  <div className={styles.panelViewStack}>
                    <PanelHeader
                      onClose={closePanel}
                      expanded={expanded}
                      onToggleExpanded={toggleExpanded}
                      chatTitle={chatTitle}
                      onChatTitleChange={onChatTitleChange}
                      onOpenSession={openSession}
                      onNewSession={resetConversation}
                      onDeleteConversation={resetConversation}
                      onShareConversation={() => setShareOpen(true)}
                      hasAssistantReply={hasAssistantReply}
                      sessionsOpen={sessionsOpen}
                      sessionsFullscreen={expanded}
                      onSessionsOpenChange={handleSessionsOpenChange}
                    />
                    <div className={styles.separator} />
                    {chatMiddle}
                  </div>
                </div>
                {selectedComponent ? (
                  <div
                    className={`${styles.detailColumn} ${
                      subcontextClosing ? styles.detailColumnExit : styles.detailColumnEnter
                    }`}
                  >
                    <ComponentDetailPanel
                      component={selectedComponent}
                      onClose={closeSubcontext}
                      onShowInConversation={() =>
                        showInConversation({ componentId: selectedComponent.id })
                      }
                    />
                  </div>
                ) : null}
                {activeReport && subcontext.view === 'slides' ? (
                  <div
                    className={`${styles.detailColumn} ${
                      subcontextClosing ? styles.detailColumnExit : styles.detailColumnEnter
                    }`}
                  >
                    <SlidesDetailPanel
                      report={activeReport}
                      components={AIR_QUALITY_COMPONENTS}
                      activeSlide={subcontext.activeSlide}
                      onSlideChange={(index) =>
                        setSubcontext({ view: 'slides', reportId: activeReport.id, activeSlide: index })
                      }
                      onClose={closeSubcontext}
                      onShowInConversation={() => showInConversation({ reportId: activeReport.id })}
                      onHome={() =>
                        setSubcontext({ view: 'slides', reportId: activeReport.id, activeSlide: 0 })
                      }
                    />
                  </div>
                ) : null}
              </div>
            </AssistantPanel>
          )}
        </div>
        <AssistantLauncher onOpen={openLauncher} />
      </div>
      <ShareModal
        open={shareOpen}
        title={`Share “${chatTitle}”`}
        onClose={() => setShareOpen(false)}
      />
    </div>
  )
}
