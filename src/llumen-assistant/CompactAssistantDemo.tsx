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
import type { AssistantMode } from './ModeSelector'
import { PanelHeader } from './PanelHeader'
import type { PanelView } from './PanelHeader'
import type { AssistantReplyPayload } from './assistantReplyTypes'
import { AssistantTimelineReply } from './AssistantTimelineReply'
import { getProactiveScenarioById } from './proactiveScenarios'
import { SessionsPanel } from './SessionsPanel'
import type { SendVisualState } from './SendButton'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; reply?: AssistantReplyPayload }

const MOCK_STREAM =
  'Net store sales for January 2026 land at about $4.2M after returns, at store-channel grain. Dubai Marina stores follow the same definition—last 45 minutes of filings included. Say if you want this broken out by day or region.'

/** Demo structured reply — non-technical surface, technical behind disclosure */
const DEMO_REPLY: AssistantReplyPayload = {
  confirmation: 'Absolutely',
  headline: 'Pulled January 2026 store-channel net sales and lined it up with how your dashboards count revenue.',
  headlineDetail:
    'We used the retail semantic model, filtered to brick-and-mortar, net of returns, for the calendar month. Open the first timeline step for the same story plus raw definitions you can audit.',
  timeline: [
    {
      id: 'pull-jan-2026',
      kind: 'tool',
      titleInProgress: 'Pulling January 2026 store-channel net sales and matching dashboard revenue rules…',
      title: 'Pulled January 2026 store-channel net sales and lined it up with how your dashboards count revenue.',
      body: 'We used the retail semantic model, filtered to brick-and-mortar, net of returns, for the calendar month. The figures you see match the executive store P&L view—not cart checkout or ship-from-store.',
      technical: [
        {
          label: 'Dashboard parity contract',
          format: 'json',
          content: `{
  "period": "2026-01",
  "channel": "store",
  "revenue_basis": "net_of_returns",
  "return_window_days": 30,
  "dashboard_surface": "exec_store_pl_monthly",
  "excludes": ["online_fulfillment", "ship_from_store_allocations"]
}`,
        },
        {
          label: 'Semantic & grain',
          format: 'plain',
          content:
            'datasource: retail_analytics\nsemantic: store_sales_monthly\ngrain: calendar_month × channel × region\nstores_included: Dubai Marina + all tagged brick-and-mortar under regional rollup',
        },
        {
          label: 'Metric lineage (extract)',
          format: 'markdown',
          content:
            '**Net store sales** ← `SUM(net_sales_after_returns)` on `fact_store_sales`\n- Joined `dim_channel` (`channel = store`)\n- Calendar: `dim_calendar` month = 2026-01\n- Returns: postings within 30-day window applied per store policy',
        },
      ],
    },
    {
      id: 'schema',
      kind: 'tool',
      titleInProgress: 'Mapping your retail sales model and warehouse tables…',
      title: 'Mapped your retail sales model and warehouse tables',
      body: 'Matched your question to the live analytics model so the total matches what leadership sees in the monthly store P&L.',
      meta: { resultCount: 3 },
      technical: [
        {
          label: 'Schema snapshot',
          format: 'plain',
          content:
            'datasource: retail_analytics\nsemantic: store_sales_monthly\ntables: fact_store_sales, dim_channel, dim_calendar\ngrain: month × channel × region',
        },
        {
          label: 'Query run',
          format: 'sql',
          content: `SELECT
  DATE_TRUNC('month', sale_ts) AS month,
  channel_id,
  SUM(net_sales_after_returns) AS net_sales
FROM fact_store_sales
JOIN dim_channel USING (channel_id)
WHERE month = '2026-01' AND channel = 'store'
GROUP BY 1, 2;`,
        },
      ],
    },
    {
      id: 'reason',
      kind: 'reasoning',
      titleInProgress: 'Narrowing to stores and applying return rules…',
      title: 'Narrowed to stores and applied return rules',
      body: 'Filtered out online fulfillment, applied your standard 30-day return window, and sanity-checked row counts before reading the total.',
    },
    {
      id: 'answer',
      kind: 'outcome',
      titleInProgress: 'Drafting what you can share back…',
      title: 'What you can share back',
      body: '',
    },
  ],
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
  const transcriptScrollRef = useRevealScrollbarOnScroll()

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

  const startAssistantStream = useCallback((reply: AssistantReplyPayload, streamText: string) => {
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
      }
    }, 28)
  }, [])

  const send = useCallback(() => {
    const t = draft.trim()
    if (!t || streaming) return
    setDraft('')
    setMessages((m) => [...m, { id: uid(), role: 'user', text: t }])
    startAssistantStream(DEMO_REPLY, MOCK_STREAM)
  }, [draft, streaming, startAssistantStream])

  const onProactivePick = useCallback(
    (scenarioId: string) => {
      if (streaming) return
      const scenario = getProactiveScenarioById(scenarioId)
      if (!scenario) return
      setDraft('')
      setMessages((m) => [...m, { id: uid(), role: 'user', text: scenario.userMessage }])
      startAssistantStream(scenario.reply, scenario.streamAnswer)
    },
    [streaming, startAssistantStream],
  )

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

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
                              onProactivePick={onProactivePick}
                              showProactiveSuggestions={!streaming && msg.id === lastAssistantMessageId}
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
                    hasThreadMessages={messages.length > 0}
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
