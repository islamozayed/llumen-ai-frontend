import { CheckCircle, Globe, ChartLine, Database, SquaresFour, Table, CaretRight } from '@phosphor-icons/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type {
  AssistantReplyPayload,
  CreatedComponent,
  CreatedComponentType,
  ThinkingStep,
  ThinkingStepKind,
  TimelineStep,
} from './assistantReplyTypes'
import { thinkingStepsFromTimeline } from './thinkingSteps'
import styles from './AssistantTimelineReply.module.css'

export type AssistantTimelineReplyProps = {
  reply: AssistantReplyPayload
  /** Final answer; shown after the timeline sequence completes (supports streaming). */
  streamingText?: string
  /** When true, the trailing word of `streamingText` is still typing — skip its reveal until complete. */
  isAnswerStreaming?: boolean
  /** Fired when the user opens a created component in the detail sub-panel. */
  onComponentSelect?: (component: CreatedComponent) => void
  /** Highlights the chip for the component currently open in the detail panel. */
  selectedComponentId?: string | null
  /** When true, skip step animation (used for older turns in the transcript). */
  instantTimeline?: boolean
  /** Conversation column used to center the thinking popover. */
  conversationPanelRef?: RefObject<HTMLElement | null>
  className?: string
}

const HEADLINE_LEAD_MS = 180
const STEP_PROGRESS_MS = 920
const STEP_GAP_MS = 160
const THINKING_STEP_REVEAL_MS = 380

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function prefersReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotionSnapshot, () => false)
}

/** Splits text into alternating word / whitespace runs (preserves spaces and line breaks). */
function splitWordSpaceSegments(text: string): { text: string; isWord: boolean }[] {
  const segments: { text: string; isWord: boolean }[] = []
  const re = /\S+|\s+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    segments.push({ text: m[0], isWord: /\S/.test(m[0]) })
  }
  return segments
}

const WORD_REVEAL_STAGGER_MS = 48

/** Proactive section: title animates first (delay 0 in CSS); chips stagger after */
const PROACTIVE_ITEM_BASE_MS = 88
const PROACTIVE_ITEM_STAGGER_MS = 76

function AnimatedWordsParagraph({
  text,
  className,
  reduceMotion,
  isStreamingTail = false,
}: {
  text: string
  className: string
  reduceMotion: boolean
  isStreamingTail?: boolean
}) {
  if (!text) return null

  if (reduceMotion) {
    return <p className={className}>{text}</p>
  }

  const segments = splitWordSpaceSegments(text)
  let wordIndex = 0

  return (
    <p className={className}>
      {segments.map((seg, idx) => {
        if (!seg.isWord) {
          return (
            <span key={`sp-${idx}`}>
              {seg.text}
            </span>
          )
        }

        const isLastSegment = idx === segments.length - 1
        const skipReveal = Boolean(isStreamingTail && isLastSegment)

        if (skipReveal) {
          return (
            <span key={`tail-${idx}`}>
              {seg.text}
            </span>
          )
        }

        const delay = wordIndex * WORD_REVEAL_STAGGER_MS
        wordIndex += 1
        return (
          <span
            key={`w-${idx}-${seg.text.slice(0, 24)}`}
            className={styles.wordReveal}
            style={{ animationDelay: `${delay}ms` }}
          >
            {seg.text}
          </span>
        )
      })}
    </p>
  )
}

function ThinkingStepIcon({ kind }: { kind: ThinkingStepKind }) {
  if (kind === 'search') {
    return (
      <span className={`${styles.thinkingStepIcon} ${styles.thinkingStepIconSearch}`} aria-hidden>
        <Globe weight="duotone" size={14} />
      </span>
    )
  }
  if (kind === 'done') {
    return (
      <span className={`${styles.thinkingStepIcon} ${styles.thinkingStepIconDone}`} aria-hidden>
        <CheckCircle weight="fill" size={14} />
      </span>
    )
  }
  return <span className={styles.thinkingStepDot} aria-hidden />
}

function ThinkingPopover({
  open,
  anchorRef,
  panelRef,
  steps,
  reduceMotion,
  onClose,
}: {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement | null>
  panelRef?: RefObject<HTMLElement | null>
  steps: ThinkingStep[]
  reduceMotion: boolean
  onClose: () => void
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ top: 0, left: 0, width: 360 })

  const updatePosition = useCallback(() => {
    const trigger = anchorRef.current
    if (!trigger) return

    const triggerRect = trigger.getBoundingClientRect()
    const panelRect = panelRef?.current?.getBoundingClientRect() ?? {
      left: 24,
      top: 24,
      width: window.innerWidth - 48,
      height: window.innerHeight - 48,
      right: window.innerWidth - 24,
      bottom: window.innerHeight - 24,
    }

    const width = Math.min(420, Math.max(300, panelRect.width - 48))
    const left = panelRect.left + (panelRect.width - width) / 2
    const popoverHeight = popoverRef.current?.offsetHeight ?? 0
    const gap = 12
    const minTop = panelRect.top + 16

    let top = triggerRect.top - popoverHeight - gap
    if (top < minTop) top = triggerRect.bottom + gap

    setLayout({ top, left, width })
  }, [anchorRef, panelRef])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    requestAnimationFrame(updatePosition)
  }, [open, steps.length, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, anchorRef, onClose])

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  if (!open) return null

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.thinkingPopover}
      style={{
        top: layout.top,
        left: layout.left,
        width: layout.width,
      }}
      role="dialog"
      aria-label="Thinking"
    >
      <p className={styles.thinkingPanelTitle}>Thinking</p>
      <ol className={styles.thinkingStepList}>
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={styles.thinkingStepItem}
            style={reduceMotion ? undefined : { animationDelay: `${index * 40}ms` }}
          >
            <ThinkingStepIcon kind={step.kind} />
            <div className={styles.thinkingStepText}>
              <span className={styles.thinkingStepTitle}>{step.title}</span>
              {step.description ? <p className={styles.thinkingStepDesc}>{step.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>,
    document.body,
  )
}

const OPENING_SUFFIX = ', let me work on this report for you.'

function ComponentCardPreview({ component }: { component: CreatedComponent }) {
  const preview = component.preview

  if (preview?.kind === 'image') {
    const cover = preview.fit === 'cover'
    return (
      <img
        className={cover ? styles.componentPreviewImageCover : styles.componentPreviewImage}
        src={preview.src}
        alt={preview.alt ?? component.title}
        loading="lazy"
      />
    )
  }

  if (preview?.kind === 'kpi') {
    return (
      <div className={styles.componentPreviewKpi}>
        <span className={styles.componentPreviewKpiValue}>
          {preview.value}
          {preview.unit ? <span className={styles.componentPreviewKpiUnit}>{preview.unit}</span> : null}
        </span>
        <span className={styles.componentPreviewKpiCaption}>{component.title}</span>
      </div>
    )
  }

  if (preview?.kind === 'text') {
    return <p className={styles.componentPreviewText}>{preview.content}</p>
  }

  return (
    <div className={styles.componentPreviewFallback} aria-hidden>
      <CreatedComponentIcon type={component.type} className={styles.componentPreviewFallbackIcon} />
    </div>
  )
}

function CreatedComponentIcon({ type, className }: { type: CreatedComponentType; className?: string }) {
  const iconProps = { className, size: 14 as const, weight: 'regular' as const, 'aria-hidden': true as const }
  switch (type) {
    case 'kpi':
      return <ChartLine {...iconProps} />
    case 'data-sample':
      return <Database {...iconProps} />
    case 'visual':
      return <SquaresFour {...iconProps} />
    case 'briefing':
      return <Table {...iconProps} />
    case 'domain':
      return <Globe {...iconProps} />
    default:
      return <Table {...iconProps} />
  }
}

export function AssistantTimelineReply({
  reply,
  streamingText,
  isAnswerStreaming = false,
  onComponentSelect,
  selectedComponentId = null,
  instantTimeline = false,
  conversationPanelRef,
  className,
}: AssistantTimelineReplyProps) {
  const { confirmation, timeline, createdComponents = [] } = reply
  const thinkingSteps = useMemo(
    () => reply.thinkingSteps ?? thinkingStepsFromTimeline(timeline),
    [reply.thinkingSteps, timeline],
  )
  const reduceMotion = usePrefersReducedMotion()

  const [revealedCount, setRevealedCount] = useState(0)
  const [runningIndex, setRunningIndex] = useState<number | null>(null)
  const [sequenceComplete, setSequenceComplete] = useState(false)
  const [thoughtExpanded, setThoughtExpanded] = useState(false)
  const [thoughtSeconds, setThoughtSeconds] = useState<number | null>(null)
  const [revealedThinkingCount, setRevealedThinkingCount] = useState(0)
  const thoughtTriggerRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thoughtStartRef = useRef(Date.now())

  useEffect(() => {
    if (instantTimeline || reduceMotion) {
      if (revealedCount > 0 && thoughtSeconds === null) {
        setThoughtSeconds(Math.max(1, Math.round((Date.now() - thoughtStartRef.current) / 1000)))
      }
      return
    }
    if (revealedCount > 0 && thoughtSeconds === null) {
      setThoughtSeconds(Math.max(1, Math.round((Date.now() - thoughtStartRef.current) / 1000)))
    }
  }, [instantTimeline, reduceMotion, revealedCount, thoughtSeconds])

  const isThinking = !instantTimeline && revealedCount === 0 && timeline.length > 0

  useEffect(() => {
    if (instantTimeline || reduceMotion) {
      setRevealedThinkingCount(thinkingSteps.length)
      return
    }
    if (!isThinking) {
      setRevealedThinkingCount(thinkingSteps.length)
      return
    }

    setRevealedThinkingCount(0)
    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setRevealedThinkingCount(i)
      if (i >= thinkingSteps.length) clearInterval(interval)
    }, THINKING_STEP_REVEAL_MS)

    return () => clearInterval(interval)
  }, [instantTimeline, isThinking, reduceMotion, thinkingSteps.length])

  useEffect(() => {
    const clearT = () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    let cancelled = false

    startTimeoutRef.current = window.setTimeout(() => {
      if (cancelled) return

      if (instantTimeline || reduceMotion) {
        setRevealedCount(timeline.length)
        setRunningIndex(null)
        setSequenceComplete(true)
        return
      }

      setSequenceComplete(false)

      const schedule = (fn: () => void, ms: number) => {
        clearT()
        timeoutRef.current = window.setTimeout(fn, ms)
      }

      setRevealedCount(0)
      setRunningIndex(null)

      if (timeline.length === 0) {
        setSequenceComplete(true)
        return
      }

      const runStep = (i: number) => {
        if (i >= timeline.length) return
        setRevealedCount(i + 1)
        setRunningIndex(i)
        schedule(() => {
          setRunningIndex(null)
          if (i < timeline.length - 1) {
            schedule(() => runStep(i + 1), STEP_GAP_MS)
          } else {
            setSequenceComplete(true)
          }
        }, STEP_PROGRESS_MS)
      }

      schedule(() => runStep(0), HEADLINE_LEAD_MS)
    }, 0)

    return () => {
      cancelled = true
      if (startTimeoutRef.current != null) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }
      clearT()
    }
  }, [timeline, reduceMotion, instantTimeline])

  const openingLine =
    confirmation && confirmation.trim().length > 0
      ? `${confirmation.trim()}${OPENING_SUFFIX}`
      : null

  const responseComplete =
    sequenceComplete && Boolean(streamingText && streamingText.length > 0) && !isAnswerStreaming
  const showThoughtRow = responseComplete && thoughtSeconds != null
  const thoughtLabel =
    thoughtSeconds != null
      ? `Thought for ${thoughtSeconds} second${thoughtSeconds === 1 ? '' : 's'}`
      : ''
  const visibleThinkingSteps = thinkingSteps.slice(
    0,
    isThinking ? revealedThinkingCount : thinkingSteps.length,
  )

  const showComponents =
    sequenceComplete &&
    Boolean(streamingText && streamingText.length > 0) &&
    !isAnswerStreaming &&
    createdComponents.length > 0 &&
    Boolean(onComponentSelect)

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {openingLine ? (
        <AnimatedWordsParagraph
          text={openingLine}
          className={styles.openingLine}
          reduceMotion={reduceMotion}
        />
      ) : null}

      {runningIndex != null && timeline[runningIndex] ? (
        <div className={styles.statusWrap} aria-live="polite">
          <div key={timeline[runningIndex].id} className={styles.statusLine}>
            <span className={`${styles.stepTitle} ${styles.stepTitleShimmer}`}>
              {timeline[runningIndex].titleInProgress ?? timeline[runningIndex].title}
            </span>
          </div>
        </div>
      ) : null}

      {sequenceComplete ? (
        <div className={styles.finalReply} aria-live="polite">
          {streamingText && streamingText.length > 0 ? (
            <AnimatedWordsParagraph
              text={streamingText}
              className={styles.finalReplyText}
              reduceMotion={reduceMotion}
              isStreamingTail={isAnswerStreaming}
            />
          ) : (
            <p className={styles.finalReplyPending}>Preparing your summary…</p>
          )}
        </div>
      ) : null}

      {showComponents ? (
        <div className={styles.createdComponentsWrap} aria-label="Created components">
          <p className={styles.createdComponentsLabel}>Created components</p>
          <ul className={styles.createdComponentsGrid}>
            {createdComponents.map((component, index) => {
              const isActive = selectedComponentId === component.id
              const previewFillsCard =
                component.preview?.kind === 'image' && component.preview.fit === 'cover'
              return (
                <li
                  key={component.id}
                  className={styles.createdComponentsItem}
                  style={{
                    animationDelay: `${PROACTIVE_ITEM_BASE_MS + index * PROACTIVE_ITEM_STAGGER_MS}ms`,
                  }}
                >
                  <button
                    type="button"
                    className={`${styles.componentCard}${isActive ? ` ${styles.componentCardActive}` : ''}`}
                    onClick={() => onComponentSelect?.(component)}
                    aria-pressed={isActive}
                  >
                    <div
                      className={`${styles.componentCardPreview}${previewFillsCard ? ` ${styles.componentCardPreviewFill}` : ''}`}
                    >
                      <ComponentCardPreview component={component} />
                    </div>
                    <div className={styles.componentCardContent}>
                      <p className={styles.componentCardTitle}>{component.title}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {showThoughtRow ? (
        <div className={styles.thinkingWrap}>
          <button
            ref={thoughtTriggerRef}
            type="button"
            className={styles.thinkingRow}
            onClick={() => setThoughtExpanded((open) => !open)}
            aria-expanded={thoughtExpanded}
            aria-haspopup="dialog"
          >
            <span className={isThinking ? styles.thinkingLabelActive : styles.thinkingLabel}>
              {thoughtLabel}
            </span>
            <CaretRight
              className={`${styles.thinkingCaret}${thoughtExpanded ? ` ${styles.thinkingCaretOpen}` : ''}`}
              size={14}
              weight="bold"
              aria-hidden
            />
          </button>
          <ThinkingPopover
            open={thoughtExpanded}
            anchorRef={thoughtTriggerRef}
            panelRef={conversationPanelRef}
            steps={visibleThinkingSteps}
            reduceMotion={reduceMotion}
            onClose={() => setThoughtExpanded(false)}
          />
        </div>
      ) : null}
    </div>
  )
}
