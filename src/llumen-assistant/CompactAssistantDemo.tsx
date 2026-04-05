/**
 * Llumen compact assistant demo — Figma alignment:
 * - Artboard "Lumen Chat 2": node-id 495-534 (file gGAXWwuoHrfYmZEBAt9T1g)
 * - Implemented variant Chat=2: node-id 529-16302
 *
 * Integration: theme tokens in src/styles/tokens.css; icons in public/llumen-assets/*.svg.
 * Production font: swap --ll-font-sans for
 * Innovator Grotesk when licensed.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { MeshGradient } from '@paper-design/shaders-react'
import styles from './compact-assistant.module.css'
import { MESH_COLORS_LUMEN_DARK, MESH_FRAME_DEMO_PAGE } from './paperMeshConstants'
import { AssistantHero } from './AssistantHero'
import { AssistantLauncher } from './AssistantLauncher'
import { AssistantPanel } from './AssistantPanel'
import { ChatComposer } from './ChatComposer'
import type { AssistantMode } from './ModeSelector'
import { PanelHeader } from './PanelHeader'
import type { PanelView } from './PanelHeader'
import { AgentThinkingPanel } from './AgentThinkingPanel'
import type { AgentActivityItem } from './AgentThinkingPanel'
import { SessionsPanel } from './SessionsPanel'
import type { SendVisualState } from './SendButton'

type AgentThinkingPayload = {
  activities: AgentActivityItem[]
  planSummary: string
  planBody: string
}

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; thinking?: AgentThinkingPayload }

const MOCK_STREAM =
  'Affirmative. A demo response stream. • Location: Dubai Marina • Time window: last 45 minutes.'

/** Demo payload — mirrors the agent “thinking” layout from design references */
const DEMO_AGENT_THINKING: AgentThinkingPayload = {
  activities: [
    { id: 'a1', label: 'Understanding request', status: 'complete', depth: 0 },
    { id: 'a2', label: 'Planning execution', status: 'active', depth: 0 },
  ],
  planSummary:
    'Resolve January 2026 store-channel net sales by calling the analytics subagent with a filtered query, then return a single numeric total with the grain documented.',
  planBody: `1. [infusion] 1. Call subagent 'schema_extractor' with the user question paraphrased.
   - call get_available_datasources
   - call get_tables_for_datasource for the retail sales semantic model
2. Call subagent 'sql_planner' to draft a net-sales measure filtered to channel = store and period = 2026-01.
3. Call subagent 'sql_runner' with the approved plan; validate row count and aggregation grain.
4. Summarize: total net sales figure + brief caveats (returns, FX, partial loads if any).`,
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function CompactAssistantDemo() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [panelView, setPanelView] = useState<PanelView>('chat')
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState<AssistantMode>('build')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const assistantMsgId = useRef<string | null>(null)
  const assistantPanelRef = useRef<HTMLDivElement>(null)
  const pendingPanelSizeRef = useRef<{ width: number; height: number } | null>(null)

  const toggleExpanded = useCallback(() => {
    const el = assistantPanelRef.current
    if (el) {
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'width,height' })
      void el.offsetWidth
      pendingPanelSizeRef.current = {
        width: el.offsetWidth,
        height: el.offsetHeight,
      }
    }
    setExpanded((v) => !v)
  }, [])

  useLayoutEffect(() => {
    const start = pendingPanelSizeRef.current
    if (!start) return
    pendingPanelSizeRef.current = null
    const el = assistantPanelRef.current
    if (!el) return

    const endWidth = el.offsetWidth
    const endHeight = el.offsetHeight

    gsap.killTweensOf(el)
    gsap.set(el, { width: start.width, height: start.height })
    gsap.to(el, {
      width: endWidth,
      height: endHeight,
      duration: 0.62,
      ease: 'power3.inOut',
      onComplete: () => {
        gsap.set(el, { clearProps: 'width,height' })
      },
    })
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
        setOpen(false)
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const startMockStream = useCallback(() => {
    const aid = uid()
    assistantMsgId.current = aid
    setMessages((m) => [
      ...m,
      { id: aid, role: 'assistant', text: '', thinking: DEMO_AGENT_THINKING },
    ])
    setStreaming(true)
    let i = 0
    streamTimer.current = setInterval(() => {
      i += 1
      const next = MOCK_STREAM.slice(0, i)
      setMessages((m) => m.map((msg) => (msg.id === aid ? { ...msg, text: next } : msg)))
      if (i >= MOCK_STREAM.length) {
        if (streamTimer.current) clearInterval(streamTimer.current)
        streamTimer.current = null
        assistantMsgId.current = null
        setStreaming(false)
      }
    }, 28)
  }, [])

  const send = useCallback(() => {
    const t = draft.trim()
    if (!t || streaming) return
    setDraft('')
    setMessages((m) => [...m, { id: uid(), role: 'user', text: t }])
    startMockStream()
  }, [draft, streaming, startMockStream])

  const stop = useCallback(() => {
    clearStream()
  }, [clearStream])

  const sendVisual: SendVisualState = streaming ? 'stop' : draft.trim() ? 'active' : 'inactive'

  const closePanel = useCallback(() => {
    setOpen(false)
    setExpanded(false)
    setPanelView('chat')
    clearStream()
  }, [clearStream])

  const openLauncher = useCallback(() => {
    setOpen(true)
    setPanelView('chat')
  }, [])

  return (
    <div className={styles.demoPage}>
      <div className={styles.demoPageShader} aria-hidden>
        <MeshGradient
          speed={0.2}
          scale={1}
          distortion={0.09}
          swirl={0}
          frame={MESH_FRAME_DEMO_PAGE}
          colors={[...MESH_COLORS_LUMEN_DARK]}
          className={styles.demoPageShaderCanvas}
        />
      </div>
      {open && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close assistant"
          onClick={closePanel}
        />
      )}
      <div className={styles.fabColumn}>
        <div
          className={`${styles.panelWrap} ${open ? '' : styles.panelWrapHidden}`}
          aria-hidden={!open}
        >
          {open && (
            <AssistantPanel ref={assistantPanelRef} expanded={expanded}>
              <PanelHeader
                isExpanded={expanded}
                onToggleExpand={toggleExpanded}
                onClose={closePanel}
                panelView={panelView}
                onOpenSessions={() => setPanelView('sessions')}
                onBackToChat={() => setPanelView('chat')}
              />
              {panelView === 'chat' ? (
                <div className={styles.middle}>
                  {messages.length === 0 ? <AssistantHero /> : null}
                  {messages.length > 0 && (
                    <div className={styles.transcript}>
                      {messages.map((msg) =>
                        msg.role === 'user' ? (
                          <div key={msg.id} className={styles.msgUser}>
                            {msg.text}
                          </div>
                        ) : msg.thinking ? (
                          <div key={msg.id} className={styles.msgAssistantBlock}>
                            <AgentThinkingPanel
                              activities={msg.thinking.activities}
                              planSummary={msg.thinking.planSummary}
                              planBody={msg.thinking.planBody}
                              replyText={msg.text || undefined}
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
                    mode={mode}
                    onModeChange={setMode}
                    showParameters
                    onAttachClick={() => {}}
                  />
                </div>
              ) : (
                <SessionsPanel
                  onOpenSession={() => setPanelView('chat')}
                  onNewSession={() => {
                    clearStream()
                    setMessages([])
                    setDraft('')
                    setPanelView('chat')
                  }}
                  onNewProject={() => {
                    clearStream()
                    setMessages([])
                    setDraft('')
                    setPanelView('chat')
                  }}
                />
              )}
            </AssistantPanel>
          )}
        </div>
        <AssistantLauncher onOpen={openLauncher} />
      </div>
    </div>
  )
}
