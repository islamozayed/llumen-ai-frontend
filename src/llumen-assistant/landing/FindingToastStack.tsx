import { useMemo, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  ChatText,
  Link,
  ThumbsDown,
  ThumbsUp,
  X,
} from '@phosphor-icons/react'
import type { LandingTellMeMorePayload } from './LandingHomeDefault'
import type { FindingToastInstance } from './findingDemoData'
import styles from './FindingToastStack.module.css'

/** Cards behind the front in the preview stack. Front + this = 3 visible. */
const MAX_VISIBLE_BEHIND = 2

export type FindingToastStackProps = {
  items: FindingToastInstance[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  /** Clears the entire finding stack (not just the front card). */
  onDismiss: () => void
  onTellMeMore?: (item: LandingTellMeMorePayload) => void
  placement?: 'landing' | 'story'
  railOpen?: boolean
}

export function FindingToastStack({
  items,
  activeIndex,
  onActiveIndexChange,
  onDismiss,
  onTellMeMore,
  placement = 'landing',
  railOpen = false,
}: FindingToastStackProps) {
  const [votes, setVotes] = useState<Record<string, 'up' | 'down' | null>>({})

  const safeIndex = items.length === 0 ? 0 : Math.min(Math.max(activeIndex, 0), items.length - 1)
  const active = items[safeIndex]

  const stackOrder = useMemo(() => {
    if (items.length === 0) return []
    // Relative depth from front: 0 = active, then next, wrapping around.
    return items.map((item, index) => {
      const depth = (index - safeIndex + items.length) % items.length
      return { item, index, depth }
    })
  }, [items, safeIndex])

  if (!active) return null

  const canNavigate = items.length > 1

  const goPrev = () => {
    if (!canNavigate) return
    onActiveIndexChange((safeIndex - 1 + items.length) % items.length)
  }

  const goNext = () => {
    if (!canNavigate) return
    onActiveIndexChange((safeIndex + 1) % items.length)
  }

  const vote = votes[active.instanceId] ?? null

  return (
    <div
      className={`${styles.root}${placement === 'story' ? ` ${styles.rootStory}` : ''}${
        railOpen ? ` ${styles.rootShifted}` : ''
      }`}
      role="region"
      aria-label="Finding notifications"
    >
      <button
        type="button"
        className={styles.navBtn}
        aria-label="Previous finding"
        disabled={!canNavigate}
        onClick={goPrev}
      >
        <CaretLeft size={18} weight="bold" aria-hidden />
      </button>

      <div className={styles.stackWrap}>
        {stackOrder
          .filter(({ depth }) => depth <= MAX_VISIBLE_BEHIND)
          .sort((a, b) => b.depth - a.depth)
          .map(({ item, depth }) => {
            const isFront = depth === 0
            // Stack upward away from the chatbox: behind cards rise + shrink.
            const scale = 1 - depth * 0.06
            const y = -depth * 28
            return (
              <article
                key={item.instanceId}
                className={`${styles.card}${isFront ? ` ${styles.cardFront}` : ` ${styles.cardBehind}`}`}
                style={{
                  zIndex: MAX_VISIBLE_BEHIND - depth + 1,
                  transform: `translateY(${y}px) scale(${scale})`,
                  // Front AI cards keep their gradient; behind peeks use frosted glass instead.
                  ...(isFront && item.type === 'ai' && item.gradient
                    ? { background: item.gradient }
                    : {}),
                }}
                aria-hidden={!isFront}
                aria-label={isFront ? `${item.domain}. ${item.title}` : undefined}
              >
                {isFront ? (
                  <>
                    <div className={styles.cardMedia} aria-hidden>
                      {item.type === 'slides' && item.image ? <img src={item.image} alt="" /> : null}
                      <div className={styles.cardScrim} />
                    </div>

                    <div className={styles.body}>
                      <div className={styles.content}>
                        <div className={styles.topRow}>
                          <p className={styles.domain}>{item.domain}</p>
                          <button
                            type="button"
                            className={styles.dismiss}
                            aria-label="Dismiss findings"
                            onClick={onDismiss}
                          >
                            <X size={12} weight="bold" aria-hidden />
                          </button>
                        </div>

                        <p className={styles.finding}>
                          {item.before}
                          <span className={styles.findingHighlight}>{item.highlight}</span>
                          {item.after}
                        </p>
                      </div>

                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() =>
                            onTellMeMore?.({
                              id: item.id,
                              title: item.title,
                              domain: item.domain,
                              finding: `${item.before}${item.highlight}${item.after}`.trim(),
                            })
                          }
                        >
                          <ChatText size={16} weight="regular" aria-hidden />
                          Tell Me More
                        </button>
                        <div className={styles.voteGroup}>
                          <button
                            type="button"
                            className={`${styles.voteBtn}${vote === 'up' ? ` ${styles.voteBtnActive}` : ''}`}
                            aria-label="Show more like this"
                            aria-pressed={vote === 'up'}
                            onClick={() =>
                              setVotes((prev) => ({
                                ...prev,
                                [item.instanceId]: prev[item.instanceId] === 'up' ? null : 'up',
                              }))
                            }
                          >
                            <ThumbsUp size={16} weight={vote === 'up' ? 'fill' : 'regular'} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={`${styles.voteBtn}${vote === 'down' ? ` ${styles.voteBtnActive}` : ''}`}
                            aria-label="Not interested"
                            aria-pressed={vote === 'down'}
                            onClick={() =>
                              setVotes((prev) => ({
                                ...prev,
                                [item.instanceId]: prev[item.instanceId] === 'down' ? null : 'down',
                              }))
                            }
                          >
                            <ThumbsDown
                              size={16}
                              weight={vote === 'down' ? 'fill' : 'regular'}
                              aria-hidden
                            />
                          </button>
                        </div>
                        {item.type === 'slides' ? (
                          <button type="button" className={styles.linkBtn} aria-label="View Slides">
                            <Link size={16} weight="regular" aria-hidden />
                            View Slides
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Dedicated frost layer: backdrop-filter must not share a node with filter/opacity. */}
                    <div className={styles.cardFrost} aria-hidden />
                    <div
                      className={styles.cardBehindScrim}
                      aria-hidden
                      style={{ background: `rgba(0, 0, 0, ${0.1 + depth * 0.12})` }}
                    />
                  </>
                )}
              </article>
            )
          })}
        {items.length > 1 ? (
          <div className={styles.pager} aria-live="polite">
            {safeIndex + 1} / {items.length}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={styles.navBtn}
        aria-label="Next finding"
        disabled={!canNavigate}
        onClick={goNext}
      >
        <CaretRight size={18} weight="bold" aria-hidden />
      </button>
    </div>
  )
}
