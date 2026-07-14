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
        <span className={styles.msgUserText}>{text}</span>
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
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')
  const [subcontext, setSubcontext] = useState<SubcontextState>({ view: 'closed' })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [chatTitle, setChatTitle] = useState('New chat')
  const titleEditedRef = useRef(false)
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const assistantMsgId = useRef<string | null>(null)
  const assistantPanelRef = useRef<HTMLDivElement>(null)
  const fabColumnRef = useRef<HTMLDivElement>(null)
  const chatMiddleRef = useRef<HTMLDivElement>(null)
  const pendingPanelAnimRef = useRef<{ width: number; height: number; top: number; left: number } | null>(
    null,
  )
  const transcriptRevealRef = useRevealScrollbarOnScroll()
  const transcriptContentKey = `${messages.length}:${streaming ? '1' : '0'}`
  const { ref: transcriptStickRef, releaseStick } = useStickToBottomScroll(transcriptContentKey)
  const transcriptElRef = useRef<HTMLDivElement | null>(null)

  const syncTranscriptScrollbarInset = useCallback(() => {
    const middle = chatMiddleRef.current
    const transcript = transcriptElRef.current
    if (!middle) return
    if (!transcript) {
      middle.style.setProperty('--lc-transcript-scrollbar-inset', '0px')
      return
    }
    const inset = Math.max(0, transcript.offsetWidth - transcript.clientWidth)
    middle.style.setProperty('--lc-transcript-scrollbar-inset', `${inset}px`)
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
    if (!transcript) {
      chatMiddleRef.current?.style.setProperty('--lc-transcript-scrollbar-inset', '0px')
      return
    }
    syncTranscriptScrollbarInset()
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
  }, [])

  useEffect(() => {
    return () => clearStream()
  }, [clearStream])

  const closeSubcontext = useCallback(() => {
    setSubcontext({ view: 'closed' })
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (subcontext.view !== 'closed') {
          closeSubcontext()
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
  }, [open, subcontext.view, closeSubcontext, expanded])

  const startAssistantReply = useCallback((reply: AssistantReplyPayload) => {
    const aid = uid()
    assistantMsgId.current = aid
    setMessages((m) => [...m, { id: aid, role: 'assistant', text: '', reply }])
    setStreaming(true)

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
    setExpanded((v) => !v)
  }, [])

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

  const splitOpen = subcontext.view !== 'closed'

  const onComponentSelect = useCallback((component: CreatedComponent) => {
    if (streaming) return
    const isMap = component.preview?.kind === 'image' && component.preview.detailView === 'map'
    setSubcontext({
      view: isMap ? 'map' : 'chart',
      componentId: component.id,
    })
  }, [streaming])

  const onReportOpen = useCallback((reportId: string) => {
    setSubcontext({ view: 'slides', reportId, activeSlide: 0 })
  }, [])

  const onOpenSubcontext = useCallback((block: AgentResponseBlock) => {
    if (block.type === 'visual' && block.openSubcontext) {
      setSubcontext({
        view: block.visualType === 'map' ? 'map' : 'chart',
        componentId: block.componentId,
      })
      return
    }
    if (block.type === 'report' && block.openSubcontext) {
      setSubcontext({ view: 'slides', reportId: block.reportId, activeSlide: 0 })
    }
  }, [])

  const stop = useCallback(() => {
    clearStream()
  }, [clearStream])

  const sendVisual: SendVisualState = streaming ? 'stop' : draft.trim() ? 'active' : 'inactive'

  const resetConversation = useCallback(() => {
    clearStream()
    setMessages([])
    setDraft('')
    setSubcontext({ view: 'closed' })
    setChatTitle('New chat')
    titleEditedRef.current = false
  }, [clearStream])

  const closePanel = useCallback(() => {
    setOpen(false)
    setExpanded(false)
    setSubcontext({ view: 'closed' })
    clearStream()
    setMessages([])
    setDraft('')
    setChatTitle('New chat')
    titleEditedRef.current = false
  }, [clearStream])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (fabColumnRef.current?.contains(target)) return
      // Thinking popover is portaled to document.body — don't treat it as outside-click.
      if (target instanceof Element && target.closest('[data-lc-thinking-popover]')) return
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
                    selectedComponentId={
                      subcontext.view === 'map' || subcontext.view === 'chart'
                        ? subcontext.componentId
                        : null
                    }
                    instantTimeline={assistant.id !== lastAssistantMessageId}
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
            <AssistantPanel ref={assistantPanelRef} expanded={expanded} splitView={splitOpen}>
              <div className={styles.splitBody}>
                <div className={`${styles.chatColumn} ${splitOpen ? styles.chatColumnSplit : ''}`}>
                  <div className={styles.panelViewStack}>
                    <PanelHeader
                      onClose={closePanel}
                      expanded={expanded}
                      onToggleExpanded={toggleExpanded}
                      chatTitle={chatTitle}
                      onChatTitleChange={onChatTitleChange}
                      onOpenSession={resetConversation}
                      onNewSession={resetConversation}
                      hasAssistantReply={hasAssistantReply}
                      splitOpen={splitOpen}
                    />
                    <div className={styles.separator} />
                    {chatMiddle}
                  </div>
                </div>
                {selectedComponent ? (
                  <div className={styles.detailColumn}>
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
                  <div className={styles.detailColumn}>
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
    </div>
  )
}
