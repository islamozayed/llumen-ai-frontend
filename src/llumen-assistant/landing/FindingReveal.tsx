import { useEffect, useRef, useState } from 'react'
import { BorderBeam } from 'border-beam'
import { llumenAssets } from '../assets'
import styles from './FindingReveal.module.css'

const COPY_DELAY_MS = 200
const STACK_DELAY_MS = 2000
const WORD_REVEAL_STAGGER_MS = 48

function splitWordSpaceSegments(text: string): { text: string; isWord: boolean }[] {
  const segments: { text: string; isWord: boolean }[] = []
  const re = /\S+|\s+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    segments.push({ text: m[0], isWord: /\S/.test(m[0]) })
  }
  return segments
}

function FindingCopyText({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  if (reduceMotion || !text) {
    return <p className={styles.copyText}>{text}</p>
  }

  const segments = splitWordSpaceSegments(text)
  let wordIndex = 0

  return (
    <p className={styles.copyText}>
      {segments.map((seg, idx) => {
        if (!seg.isWord) {
          return <span key={`sp-${idx}`}>{seg.text}</span>
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

export type FindingRevealProps = {
  count: number
  /** Fires once the intro (aurora + copy) has finished and the stack should appear. */
  onReady: () => void
}

/**
 * Finding notification intro: line-beam aurora behind the chatbox with Llumen copy.
 * Unmounted when the finding stack appears.
 */
export function FindingReveal({ count, onReady }: FindingRevealProps) {
  const [copyVisible, setCopyVisible] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduceMotion(reduce)
    if (reduce) {
      onReadyRef.current()
      return
    }
    const copyTimer = window.setTimeout(() => setCopyVisible(true), COPY_DELAY_MS)
    const readyTimer = window.setTimeout(() => onReadyRef.current(), STACK_DELAY_MS)
    return () => {
      window.clearTimeout(copyTimer)
      window.clearTimeout(readyTimer)
    }
  }, [])

  const message =
    count === 1
      ? 'I found 1 thing that might need your attention'
      : `I found ${count} things that might need your attention`

  return (
    <>
      {copyVisible ? (
        <div className={styles.aurora} aria-hidden>
          <BorderBeam
            size="line"
            theme="dark"
            colorVariant="colorful"
            brightness={2.2}
            saturation={1.4}
            duration={1.7}
            active
            className={styles.beam}
          >
            <div className={styles.track} />
          </BorderBeam>
        </div>
      ) : null}
      {copyVisible ? (
        <div className={styles.copy} aria-live="polite">
          <img className={styles.copyOrb} src={llumenAssets.launcherOrb} alt="" />
          <FindingCopyText text={message} reduceMotion={reduceMotion} />
        </div>
      ) : null}
    </>
  )
}
