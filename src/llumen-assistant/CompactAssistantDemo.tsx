/**
 * Llumen compact assistant demo — Figma alignment:
 * - Artboard "Lumen Chat 2": node-id 495-534 (file gGAXWwuoHrfYmZEBAt9T1g)
 * - Implemented variant Chat=2: node-id 529-16302
 *
 * Integration: theme tokens in src/styles/tokens.css; icons in public/llumen-assets/*.svg.
 * Sans UI font: Innovator Grotesk (see /fonts and @font-face in tokens.css).
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
import type { PanelView } from './PanelHeader'
import type { AssistantReplyPayload } from './assistantReplyTypes'
import { AssistantTimelineReply } from './AssistantTimelineReply'
import { ComponentDetailPanel } from './ComponentDetailPanel'
import { DATA_FETCH_REPLY, DATA_FETCH_STREAM, withCreatedComponents, COMPONENT_STREAM_SUFFIX } from './createdComponentsDemo'
import { DEMO_THINKING_STEPS } from './thinkingSteps'
import { buildStandardTimeline } from './standardTimeline'
import type { CreatedComponent } from './assistantReplyTypes'
import { SessionsPanel } from './SessionsPanel'
import type { SendVisualState } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; reply?: AssistantReplyPayload }

const MOCK_STREAM =
  'Net store sales for January 2026 land at about $4.2M after returns, at store-channel grain. Dubai Marina stores follow the same definition—last 45 minutes of filings included. Say if you want this broken out by day or region.' +
  COMPONENT_STREAM_SUFFIX

/** Demo structured reply — non-technical surface, technical behind disclosure */
const DEMO_REPLY: AssistantReplyPayload = {
  confirmation: 'Absolutely',
  thinkingSteps: DEMO_THINKING_STEPS,
  headline: 'Pulled January 2026 store-channel net sales and lined it up with how your dashboards count revenue.',
  headlineDetail:
    'We used the retail semantic model, filtered to brick-and-mortar, net of returns, for the calendar month. Open the first timeline step for the same story plus raw definitions you can audit.',
  timeline: buildStandardTimeline(
    'January 2026 store-channel net sales and how those figures align with executive dashboard revenue definitions',
    'retail sales models, brick-and-mortar revenue semantics, and store P&L data sources',
  ),
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function CompactAssistantDemo() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [panelView, setPanelView] = useState<PanelView>('chat')
  const [draft, setDraft] = useState('')
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null)
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
      clearInterval(streamTimer.current)
      streamTimer.current = null
    }
    assistantMsgId.current = null
    setStreaming(false)
  }, [])

  useEffect(() => {
    return () => clearStream()
  }, [clearStream])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (selectedComponentId) {
          setSelectedComponentId(null)
          return
        }
        setOpen(false)
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, selectedComponentId])

  const startAssistantStream = useCallback(
    (reply: AssistantReplyPayload, streamText: string, onComplete?: () => void) => {
      const aid = uid()
      assistantMsgId.current = aid
      setMessages((m) => [...m, { id: aid, role: 'assistant', text: '', reply }])
      setStreaming(true)
      let i = 0
      streamTimer.current = setInterval(() => {
        i += 1
        const next = streamText.slice(0, i)
        setMessages((m) => m.map((msg) => (msg.id === aid ? { ...msg, text: next } : msg)))
        if (i >= streamText.length) {
          if (streamTimer.current) clearInterval(streamTimer.current)
          streamTimer.current = null
          assistantMsgId.current = null
          setStreaming(false)
          onComplete?.()
        }
      }, 28)
    },
    [],
  )

  const send = useCallback(() => {
    const t = draft.trim()
    if (!t || streaming) return
    setDraft('')
    setSelectedComponentId(null)
    setMessages((m) => [...m, { id: uid(), role: 'user', text: t }])
    const lower = t.toLowerCase()
    const reply =
      lower.includes('data') && (lower.includes('fetch') || lower.includes('can you'))
        ? DATA_FETCH_REPLY
        : withCreatedComponents(DEMO_REPLY)
    const streamText = reply === DATA_FETCH_REPLY ? DATA_FETCH_STREAM : MOCK_STREAM
    startAssistantStream(reply, streamText, () => {
      if (reply === DATA_FETCH_REPLY) setSelectedComponentId('high-heat-districts')
    })
  }, [draft, streaming, startAssistantStream])

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  const selectedComponent = useMemo((): CreatedComponent | null => {
    if (!selectedComponentId) return null
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role !== 'assistant' || !msg.reply?.createdComponents) continue
      const found = msg.reply.createdComponents.find((c) => c.id === selectedComponentId)
      if (found) return found
    }
    return null
  }, [messages, selectedComponentId])

  const onComponentSelect = useCallback(
    (component: CreatedComponent) => {
      if (streaming) return
      setSelectedComponentId(component.id)
    },
    [streaming],
  )

  const closeComponentDetail = useCallback(() => {
    setSelectedComponentId(null)
  }, [])

  const stop = useCallback(() => {
    clearStream()
  }, [clearStream])

  const sendVisual: SendVisualState = streaming ? 'stop' : draft.trim() ? 'active' : 'inactive'

  const closePanel = useCallback(() => {
    setOpen(false)
    setExpanded(false)
    setSelectedComponentId(null)
    setPanelView('chat')
    clearStream()
    setMessages([])
    setDraft('')
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
              <div key={msg.id} className={styles.msgUser}>
                {msg.text}
              </div>
            ) : msg.reply ? (
              <div key={msg.id} className={styles.msgAssistantTimeline}>
                <AssistantTimelineReply
                  key={msg.id}
                  reply={msg.reply}
                  streamingText={msg.text}
                  isAnswerStreaming={streaming && assistantMsgId.current === msg.id}
                  onComponentSelect={onComponentSelect}
                  selectedComponentId={selectedComponentId}
                  instantTimeline={msg.id !== lastAssistantMessageId}
                  conversationPanelRef={chatMiddleRef}
                />
              </div>
            ) : (
              <div key={msg.id} className={styles.msgAssistant}>
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
      <div className={`${styles.fabColumn}${selectedComponent ? ` ${styles.fabColumnSplit}` : ''}`}>
        <div
          className={`${styles.panelWrap} ${open ? '' : styles.panelWrapHidden}`}
          aria-hidden={!open}
        >
          {open && (
            <AssistantPanel ref={assistantPanelRef} expanded={expanded} splitView={Boolean(selectedComponent)}>
              <div className={styles.splitBody}>
                <div className={`${styles.chatColumn} ${selectedComponent ? styles.chatColumnSplit : ''}`}>
                  <div
                    className={panelView === 'sessions' ? styles.panelViewHidden : styles.panelViewStack}
                    aria-hidden={panelView === 'sessions'}
                  >
                    <PanelHeader
                      onClose={closePanel}
                      panelView={panelView}
                      onOpenSessions={() => setPanelView('sessions')}
                      onBackToChat={() => setPanelView('chat')}
                    />
                    <div className={selectedComponent ? styles.chatColumnSeparator : styles.separator} />
                    {chatMiddle}
                  </div>
                  <div
                    className={panelView === 'chat' ? styles.panelViewHidden : styles.panelViewStack}
                    aria-hidden={panelView === 'chat'}
                  >
                    <SessionsPanel
                      onBack={() => setPanelView('chat')}
                      onOpenSession={() => setPanelView('chat')}
                      onNewSession={() => {
                        clearStream()
                        setMessages([])
                        setDraft('')
                        setPanelView('chat')
                      }}
                    />
                  </div>
                </div>
                {selectedComponent ? (
                  <div className={styles.detailColumn}>
                    <ComponentDetailPanel component={selectedComponent} onClose={closeComponentDetail} />
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
