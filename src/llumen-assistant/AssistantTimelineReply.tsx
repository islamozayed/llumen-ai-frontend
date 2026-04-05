import {
  Content as AccordionContent,
  Header as AccordionHeader,
  Item as AccordionItem,
  Root as AccordionRoot,
  Trigger as AccordionTrigger,
} from '@radix-ui/react-accordion'
import { CheckCircle, Clock, Globe } from '@phosphor-icons/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { AssistantReplyPayload, TechnicalBlock, TimelineStep } from './assistantReplyTypes'
import { PROACTIVE_SCENARIOS } from './proactiveScenarios'
import styles from './AssistantTimelineReply.module.css'
import { useRevealScrollbarOnScroll } from './useRevealScrollbarOnScroll'

export type AssistantTimelineReplyProps = {
  reply: AssistantReplyPayload
  /** Final answer; shown after the timeline sequence completes (supports streaming). */
  streamingText?: string
  /** When true, the trailing word of `streamingText` is still typing — skip its reveal until complete. */
  isAnswerStreaming?: boolean
  /** Fired with a scenario id when the user picks a proactive follow-up (parent sends user msg + assistant turn). */
  onProactivePick?: (scenarioId: string) => void
  /** False for older assistant turns so only the latest reply shows follow-ups. */
  showProactiveSuggestions?: boolean
  className?: string
}

const HEADLINE_LEAD_MS = 500
const STEP_PROGRESS_MS = 2000
const STEP_GAP_MS = 350

function normalizeTechnical(technical: TechnicalBlock | TechnicalBlock[]): TechnicalBlock[] {
  return Array.isArray(technical) ? technical : [technical]
}

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
/** ~match `.wordReveal` animation duration in CSS */
const WORD_REVEAL_DURATION_MS = 460

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

function StepIcon({ kind, className }: { kind: TimelineStep['kind']; className?: string }) {
  const cls = [styles.kindIcon, className].filter(Boolean).join(' ')
  const tone =
    kind === 'tool'
      ? `${cls} ${styles.kindIconTool}`
      : kind === 'outcome'
        ? `${cls} ${styles.kindIconOutcome}`
        : cls
  return (
    <span className={tone} aria-hidden>
      {kind === 'tool' ? (
        <Globe weight="duotone" size={14} />
      ) : kind === 'outcome' ? (
        <CheckCircle weight="fill" size={14} />
      ) : (
        <Clock weight="duotone" size={14} />
      )}
    </span>
  )
}

function TechBlockPre({ children }: { children: string }) {
  const scrollRef = useRevealScrollbarOnScroll()
  return (
    <pre ref={scrollRef} className={styles.techBlockPre}>
      {children}
    </pre>
  )
}

function TechnicalDisclosure({ blocks }: { blocks: TechnicalBlock[] }) {
  if (blocks.length === 0) return null
  return (
    <details className={styles.techDetails}>
      <summary className={styles.techSummary}>View technical details</summary>
      <div className={styles.techBody}>
        {blocks.map((block, i) => (
          <div key={`${block.label ?? 'block'}-${i}`}>
            {block.label ? <p className={styles.techBlockLabel}>{block.label}</p> : null}
            <TechBlockPre>{block.content}</TechBlockPre>
          </div>
        ))}
      </div>
    </details>
  )
}

const OPENING_SUFFIX = ', let me work on this report for you.'

export function AssistantTimelineReply({
  reply,
  streamingText,
  isAnswerStreaming = false,
  onProactivePick,
  showProactiveSuggestions = true,
  className,
}: AssistantTimelineReplyProps) {
  const { confirmation, timeline } = reply
  const reduceMotion = usePrefersReducedMotion()

  const [revealedCount, setRevealedCount] = useState(0)
  const [runningIndex, setRunningIndex] = useState<number | null>(null)
  const [sequenceComplete, setSequenceComplete] = useState(false)
  const [proactiveReady, setProactiveReady] = useState(false)
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!showProactiveSuggestions || !onProactivePick) {
      setProactiveReady(false)
      return
    }
    if (!sequenceComplete || isAnswerStreaming || !streamingText || streamingText.length === 0) {
      setProactiveReady(false)
      return
    }
    if (reduceMotion) {
      setProactiveReady(true)
      return
    }
    const wordCount = splitWordSpaceSegments(streamingText).filter((s) => s.isWord).length
    const lastStaggerStart = Math.max(0, wordCount - 1) * WORD_REVEAL_STAGGER_MS
    const delay = lastStaggerStart + WORD_REVEAL_DURATION_MS + 60
    const id = window.setTimeout(() => setProactiveReady(true), delay)
    return () => clearTimeout(id)
  }, [
    showProactiveSuggestions,
    onProactivePick,
    sequenceComplete,
    isAnswerStreaming,
    streamingText,
    reduceMotion,
  ])

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

      if (reduceMotion) {
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
  }, [timeline, reduceMotion])

  const openingLine =
    confirmation && confirmation.trim().length > 0
      ? `${confirmation.trim()}${OPENING_SUFFIX}`
      : null

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {openingLine ? (
        <AnimatedWordsParagraph
          text={openingLine}
          className={styles.openingLine}
          reduceMotion={reduceMotion}
        />
      ) : null}

      <div className={styles.timeline} onMouseLeave={() => setHoveredStepId(null)}>
        <AccordionRoot type="multiple" className={styles.stepsAccordion}>
          {timeline.map((step, index) => {
            if (index >= revealedCount) return null

            const raw = step.body
            const showBody = raw != null && raw !== ''
            const technicalBlocks = step.technical ? normalizeTechnical(step.technical) : []
            const isRunning = runningIndex === index
            const showProgressCopy = isRunning && Boolean(step.titleInProgress)
            const rowTitle = showProgressCopy ? (step.titleInProgress as string) : step.title
            const showMeta = step.meta?.resultCount != null && !isRunning
            const dimStep = hoveredStepId !== null && hoveredStepId !== step.id

            return (
              <AccordionItem
                key={step.id}
                value={step.id}
                className={[styles.stepItem, dimStep ? styles.stepItemDimmed : ''].filter(Boolean).join(' ')}
              >
                <AccordionHeader className={styles.stepAccordionHeader}>
                  <AccordionTrigger
                    className={styles.stepTrigger}
                    onMouseEnter={() => setHoveredStepId(step.id)}
                  >
                    <StepIcon kind={step.kind} />
                    <span
                      className={
                        isRunning && step.titleInProgress
                          ? `${styles.stepTitle} ${styles.stepTitleShimmer}`
                          : styles.stepTitle
                      }
                    >
                      {rowTitle}
                    </span>
                    {showMeta && step.meta?.resultCount != null ? (
                      <span className={styles.resultChip}>{step.meta.resultCount} results</span>
                    ) : null}
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent
                  className={styles.stepAccordionContent}
                  onMouseEnter={() => setHoveredStepId(step.id)}
                >
                  {showBody ? <p className={styles.stepBody}>{raw}</p> : null}
                  {technicalBlocks.length > 0 ? <TechnicalDisclosure blocks={technicalBlocks} /> : null}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </AccordionRoot>
      </div>

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

      {sequenceComplete &&
      proactiveReady &&
      showProactiveSuggestions &&
      onProactivePick &&
      streamingText &&
      streamingText.length > 0 &&
      !isAnswerStreaming ? (
        <div className={styles.proactiveWrap} aria-label="Things I can do next">
          <p className={styles.proactiveLabel}>Things I can do next</p>
          <ul className={styles.proactiveList}>
            {PROACTIVE_SCENARIOS.map((scenario, index) => (
              <li
                key={scenario.id}
                className={styles.proactiveListItem}
                style={{
                  animationDelay: `${PROACTIVE_ITEM_BASE_MS + index * PROACTIVE_ITEM_STAGGER_MS}ms`,
                }}
              >
                <button
                  type="button"
                  className={styles.proactiveBtn}
                  onClick={() => onProactivePick(scenario.id)}
                >
                  {scenario.suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
