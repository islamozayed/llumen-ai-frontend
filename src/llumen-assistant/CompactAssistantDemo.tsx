/**
 * Llumen compact assistant demo — air-quality conversation flow.
 * Integration: theme tokens in src/styles/tokens.css; icons in public/llumen-assets/*.svg.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import type { ChatQuestionIndexItem, PanelView } from './PanelHeader'
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
import { SessionsPanel } from './SessionsPanel'
import type { SendVisualState } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

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

export function CompactAssistantDemo() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [panelView, setPanelView] = useState<PanelView>('chat')
  const [draft, setDraft] = useState('')
  const [subcontext, setSubcontext] = useState<SubcontextState>({ view: 'closed' })
  const pausedSubcontextRef = useRef<SubcontextState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [chatTitle, setChatTitle] = useState('New chat')
  const titleEditedRef = useRef(false)
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const assistantMsgId = useRef<string | null>(null)
  const assistantPanelRef = useRef<HTMLDivElement>(null)
  const chatMiddleRef = useRef<HTMLDivElement>(null)
  const pendingPanelAnimRef = useRef<{ width: number; height: number; top: number; left: number } | null>(
    null,
  )
  const transcriptScrollRef = useRevealScrollbarOnScroll()

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

  const openSessions = useCallback(() => {
    pausedSubcontextRef.current = subcontext
    setSubcontext({ view: 'closed' })
    setPanelView('sessions')
  }, [subcontext])

  const backToChat = useCallback(() => {
    setPanelView('chat')
    const paused = pausedSubcontextRef.current
    pausedSubcontextRef.current = null
    if (paused && paused.view !== 'closed') {
      setSubcontext(paused)
    }
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
      const response = messages.slice(i + 1).find((m) => m.role === 'assistant')
      if (!response) continue
      items.push({
        id: msg.id,
        question: msg.text,
        responseId: response.id,
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

  const jumpToResponse = useCallback((responseId: string) => {
    const root = chatMiddleRef.current
    const target = root?.querySelector(`[data-message-id="${CSS.escape(responseId)}"]`)
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

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

  const closePanel = useCallback(() => {
    setOpen(false)
    setExpanded(false)
    setSubcontext({ view: 'closed' })
    pausedSubcontextRef.current = null
    setPanelView('chat')
    clearStream()
    setMessages([])
    setDraft('')
    setChatTitle('New chat')
    titleEditedRef.current = false
  }, [clearStream])

  const openLauncher = useCallback(() => {
    setOpen(true)
    setPanelView('chat')
  }, [])

  const isNewChat = messages.length === 0

  const chatMiddle = (
    <div ref={chatMiddleRef} className={`${styles.middle} ${isNewChat ? styles.middleEmpty : ''}`}>
      {isNewChat ? (
        <AssistantHero />
      ) : (
        <div ref={transcriptScrollRef} className={styles.transcript}>
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} data-message-id={msg.id} className={styles.msgUser}>
                {msg.text}
              </div>
            ) : msg.reply ? (
              <div key={msg.id} data-message-id={msg.id} className={styles.msgAssistantTimeline}>
                <AssistantTimelineReply
                  key={msg.id}
                  reply={msg.reply}
                  streamingText={msg.text}
                  isAnswerStreaming={streaming && assistantMsgId.current === msg.id}
                  onComponentSelect={onComponentSelect}
                  onReportOpen={onReportOpen}
                  onOpenSubcontext={onOpenSubcontext}
                  selectedComponentId={
                    subcontext.view === 'map' || subcontext.view === 'chart'
                      ? subcontext.componentId
                      : null
                  }
                  instantTimeline={msg.id !== lastAssistantMessageId}
                  conversationPanelRef={chatMiddleRef}
                />
              </div>
            ) : (
              <div key={msg.id} data-message-id={msg.id} className={styles.msgAssistant}>
                {msg.text || '\u00a0'}
              </div>
            ),
          )}
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
      {open && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close assistant"
          onClick={closePanel}
        />
      )}
      <div className={`${styles.fabColumn}${splitOpen ? ` ${styles.fabColumnSplit}` : ''}`}>
        <div
          className={`${styles.panelWrap} ${open ? '' : styles.panelWrapHidden}`}
          aria-hidden={!open}
        >
          {open && (
            <AssistantPanel ref={assistantPanelRef} expanded={expanded} splitView={splitOpen}>
              <div className={styles.splitBody}>
                <div className={`${styles.chatColumn} ${splitOpen ? styles.chatColumnSplit : ''}`}>
                  <div
                    className={panelView === 'sessions' ? styles.panelViewHidden : styles.panelViewStack}
                    aria-hidden={panelView === 'sessions'}
                  >
                    <PanelHeader
                      onClose={closePanel}
                      panelView={panelView}
                      onOpenSessions={openSessions}
                      onBackToChat={backToChat}
                      expanded={expanded}
                      onToggleExpanded={toggleExpanded}
                      chatTitle={chatTitle}
                      onChatTitleChange={onChatTitleChange}
                      questions={questionIndex}
                      onJumpToResponse={jumpToResponse}
                    />
                    <div className={styles.separator} />
                    {chatMiddle}
                  </div>
                  <div
                    className={panelView === 'chat' ? styles.panelViewHidden : styles.panelViewStack}
                    aria-hidden={panelView === 'chat'}
                  >
                    <SessionsPanel
                      onBack={backToChat}
                      onOpenSession={backToChat}
                      onNewSession={() => {
                        clearStream()
                        setMessages([])
                        setDraft('')
                        setSubcontext({ view: 'closed' })
                        pausedSubcontextRef.current = null
                        setChatTitle('New chat')
                        titleEditedRef.current = false
                        setPanelView('chat')
                      }}
                    />
                  </div>
                </div>
                {selectedComponent ? (
                  <div className={styles.detailColumn}>
                    <ComponentDetailPanel component={selectedComponent} onClose={closeSubcontext} />
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
