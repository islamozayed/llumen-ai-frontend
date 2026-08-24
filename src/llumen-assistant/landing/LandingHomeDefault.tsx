/**
 * Figma: Landing (node 3134:1416)
 * https://www.figma.com/design/IEipD1hKFb0H7jCLU53nP2/Test-Llumen?node-id=3134-1416
 *
 * Page background comes from CompactAssistantDemo MeshGradient.
 */
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChatText,
  GearSix,
  LockSimple,
  MagnifyingGlass,
  Pause,
  Play,
  Plus,
  SquaresFour,
  ThumbsDown,
  ThumbsUp,
  User,
  Users,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { landingAssets as a } from './landingAssets'
import styles from './LandingHome.module.css'

const AUTOPLAY_MS = 7000
const CAROUSEL_GAP = 12
const PEEK_COUNT = 2
const CAROUSEL_MS = 560

function wrap(index: number, length: number) {
  return ((index % length) + length) % length
}

type CardLayout = { left: number; width: number }

type CardMetrics = {
  heroWidth: number
  peekWidth: number
  trackWidth: number
}

function cardMetrics(trackWidth: number, peekCount: number): CardMetrics {
  if (trackWidth <= 0) return { heroWidth: 0, peekWidth: 0, trackWidth: 0 }
  if (peekCount === 0) {
    return { heroWidth: trackWidth, peekWidth: trackWidth, trackWidth }
  }
  const gaps = CAROUSEL_GAP * peekCount
  const available = Math.max(0, trackWidth - gaps)
  const heroWidth = available * (1023 / 1857)
  const peekWidth = (available - heroWidth) / peekCount
  return { heroWidth, peekWidth, trackWidth }
}

function carouselLayout(
  rel: number,
  metrics: CardMetrics,
  exiting: boolean,
  peekCount: number,
): CardLayout {
  const { heroWidth, peekWidth, trackWidth } = metrics
  if (trackWidth <= 0) return { left: 0, width: 0 }
  if (exiting) return { left: -(heroWidth + CAROUSEL_GAP), width: heroWidth }
  if (rel === 0) return { left: 0, width: heroWidth }
  if (peekCount > 0 && rel <= peekCount) {
    return {
      left: heroWidth + CAROUSEL_GAP + (rel - 1) * (peekWidth + CAROUSEL_GAP),
      width: peekWidth,
    }
  }
  return { left: trackWidth + CAROUSEL_GAP, width: peekWidth }
}

function isOffstage(layout: CardLayout, trackWidth: number) {
  return layout.width <= 0 || layout.left + layout.width <= 0 || layout.left >= trackWidth
}

function crossesOffstage(prev: CardLayout | undefined, next: CardLayout, trackWidth: number) {
  if (!prev || trackWidth <= 0) return false
  const prevOffLeft = prev.left + prev.width <= 1
  const prevOffRight = prev.left >= trackWidth - 1
  const nextOffLeft = next.left + next.width <= 1
  const nextOffRight = next.left >= trackWidth - 1
  return (prevOffLeft && nextOffRight) || (prevOffRight && nextOffLeft)
}

const WORKSPACE_FILTERS = [
  { label: 'All', icon: 'all' },
  { label: 'Private', icon: 'private' },
  { label: 'Shared With Me', icon: 'shared' },
] as const

const CATEGORY_FILTERS = [
  'Finance',
  'Operations',
  'HR',
  'Sales',
  'Marketing',
  'IT',
  'Product',
  'Engineering',
  'Customer Success',
] as const

const AI_GRADIENTS = [
  'linear-gradient(180deg, #4a4969 0%, #7072ab 50%, #cd82a0 100%)',
  'linear-gradient(180deg, #3d4a6b 0%, #6a7ab8 48%, #c48bb0 100%)',
  'linear-gradient(180deg, #52446e 0%, #7c72b4 50%, #d08aa8 100%)',
  'linear-gradient(180deg, #394860 0%, #6478a8 48%, #c47a96 100%)',
  'linear-gradient(165deg, #4a3d69 0%, #7a6ab0 52%, #d48aa0 100%)',
  'linear-gradient(180deg, #3e4568 0%, #6d7aaa 52%, #c98aa4 100%)',
] as const

type ChartSeries = {
  name: string
  value: string
  pct: number
  color: string
}

type AttentionItem = {
  id: string
  type: 'slides' | 'chart' | 'ai'
  title: string
  domain: string
  before: string
  highlight: string
  after: string
  image?: string
  gradient?: string
  chart?: {
    label: string
    value: string
    series: ChartSeries[]
  }
}

const POPULATION_CHART: NonNullable<AttentionItem['chart']> = {
  label: 'Population',
  value: '2,500,000',
  series: [
    { name: 'Adults (20-59)', value: '1,700,000 (68%)', pct: 68, color: '#3fa7a0' },
    { name: 'Youth (0-19)', value: '675,000 (27%)', pct: 27, color: '#9bbf6a' },
    { name: 'Seniors (60+)', value: '125,000 (5%)', pct: 5, color: '#c56b3c' },
  ],
}

const LAND_USE_CHART: NonNullable<AttentionItem['chart']> = {
  label: 'Land use',
  value: '100%',
  series: [
    { name: 'Residential', value: '42%', pct: 42, color: '#3fa7a0' },
    { name: 'Industrial', value: '31%', pct: 31, color: '#9bbf6a' },
    { name: 'Open space', value: '27%', pct: 27, color: '#c56b3c' },
  ],
}

const ATTENTION: AttentionItem[] = [
  {
    id: 'dumping-map',
    type: 'slides',
    title: 'Environmental Wellness Monitoring Checks',
    domain: 'Engineering',
    before: 'There has been a noticeable rise in illegal dumping operations throughout Abu Dhabi, with reports ',
    highlight: 'increasing by 35%',
    after: ' compared with last week',
    image: a.slideMap,
  },
  {
    id: 'dumping-chart',
    type: 'chart',
    title: 'Environmental Wellness Monitoring Checks',
    domain: 'Engineering',
    before: 'There has been a noticeable rise in illegal dumping operations throughout Abu Dhabi, with reports ',
    highlight: 'increasing by 35%',
    after: ' compared with last week',
    chart: POPULATION_CHART,
  },
  {
    id: 'dumping-ai',
    type: 'ai',
    title: 'Environmental Wellness Monitoring Checks',
    domain: 'Engineering',
    before: 'There has been a noticeable rise in illegal dumping operations throughout Abu Dhabi, with reports ',
    highlight: 'increasing by 35%',
    after: ' compared with last week',
    gradient: AI_GRADIENTS[0],
  },
  {
    id: 'aqi-map',
    type: 'slides',
    title: 'Air Quality Corridor Review',
    domain: 'Operations',
    before: 'Fine particulate readings along the coastal corridor are ',
    highlight: 'up 18% overnight',
    after: ', with three districts crossing the sensitive-group threshold',
    image: a.recMapB,
  },
  {
    id: 'land-chart',
    type: 'chart',
    title: 'Land-use Pressure Brief',
    domain: 'Product',
    before: 'Industrial parcels adjacent to residential zones expanded this quarter, ',
    highlight: 'outpacing housing by 2.1×',
    after: ' versus the five-year average',
    chart: LAND_USE_CHART,
  },
  {
    id: 'proactive-ai',
    type: 'ai',
    title: 'Proactive Risk Digest',
    domain: 'Customer Success',
    before: 'Llumen flagged a clustered complaint pattern in MBZ City that typically precedes ',
    highlight: 'service-center delays of 40 minutes',
    after: ' within 72 hours',
    gradient: AI_GRADIENTS[2],
  },
]

const RECOMMENDED = [
  {
    id: 'r1',
    category: 'Engineering',
    title: 'Building a Scalable Microservices Architecture From the Ground Up',
    kind: 'Story',
    sections: '19 Sections',
    image: a.slideMap,
  },
  {
    id: 'r2',
    category: 'Marketing',
    title: 'Brand Repositioning Strategy for the Next-Gen Consumer Market',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recMapB,
  },
  {
    id: 'r3',
    category: 'Product',
    title: 'User Onboarding Redesign: Reducing Time-to-Value by 40%',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recThumbB,
  },
  {
    id: 'r4',
    category: 'Sales',
    title: 'Enterprise Pipeline Acceleration: Lessons From Q3 Wins',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recMapC,
  },
  {
    id: 'r5',
    category: 'Operations',
    title: 'Streamlining Cross-Team Workflows With Automation',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recMapD,
  },
  {
    id: 'r6',
    category: 'HR',
    title: 'Remote Culture Playbook: Keeping Teams Connected at Scale',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recThumbA,
  },
  {
    id: 'r7',
    category: 'Customer Success',
    title: 'Reducing Churn Through Proactive Health Scoring',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recThumbC,
  },
  {
    id: 'r8',
    category: 'Finance',
    title: 'Annual Budget Planning Framework for Hypergrowth Startups',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image118,
  },
  {
    id: 'r9',
    category: 'IT',
    title: 'Zero-Trust Security Rollout: A 90-Day Implementation Guide',
    kind: 'Story',
    sections: '19 Sections',
    image: a.recThumbD,
  },
  {
    id: 'r10',
    category: 'Engineering',
    title: 'Migrating Legacy Systems to Cloud-Native Infrastructure',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image117,
  },
  {
    id: 'r11',
    category: 'Marketing',
    title: 'Content-Led Growth: Driving Organic Acquisition at Scale',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image119,
  },
  {
    id: 'r12',
    category: 'Product',
    title: 'Feature Prioritization With Impact vs Effort Scoring',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image120,
  },
] as const

function FilterIcon({ name }: { name: (typeof WORKSPACE_FILTERS)[number]['icon'] }) {
  if (name === 'all') return <SquaresFour size={20} weight="regular" aria-hidden />
  if (name === 'private') return <LockSimple size={20} weight="regular" aria-hidden />
  return <Users size={20} weight="regular" aria-hidden />
}

function Finding({
  before,
  highlight,
  after,
}: {
  before: string
  highlight: string
  after: string
}) {
  return (
    <p className={styles.finding}>
      {before}
      <span className={styles.findingHighlight}>{highlight}</span>
      {after}
    </p>
  )
}

function PopulationChart({ chart }: { chart: NonNullable<AttentionItem['chart']> }) {
  return (
    <div className={styles.chart}>
      <p className={styles.chartLabel}>{chart.label}</p>
      <p className={styles.chartValue}>{chart.value}</p>
      <div className={styles.chartBar} aria-hidden>
        {chart.series.map((row) => (
          <span
            key={row.name}
            className={styles.chartSeg}
            style={{ flex: `${row.pct} 0 0`, background: row.color }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {chart.series.map((row) => (
          <li key={row.name} className={styles.legendRow}>
            <span className={styles.legendName}>
              <span className={styles.legendDot} style={{ background: row.color }} />
              {row.name}
            </span>
            <span className={styles.legendVal}>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VoteButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  const tooltipId = useId()
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const show = (event: { currentTarget: HTMLButtonElement }) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.voteBtn}${pressed ? ` ${styles.voteBtnActive}` : ''}`}
        aria-pressed={pressed}
        aria-label={label}
        aria-describedby={pos ? tooltipId : undefined}
        onClick={onClick}
        onMouseEnter={show}
        onMouseMove={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
      >
        {children}
      </button>
      {pos
        ? createPortal(
            <div id={tooltipId} className={styles.tooltip} role="tooltip" style={{ left: pos.x, top: pos.y }}>
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function AttentionCard({
  item,
  expanded,
  slotClass,
  layout,
  offstage,
  snap,
  onExpand,
  vote,
  onVote,
}: {
  item: AttentionItem
  expanded: boolean
  slotClass: string
  layout: CardLayout
  offstage: boolean
  snap: boolean
  onExpand?: () => void
  vote: 'up' | 'down' | null
  onVote: (value: 'up' | 'down') => void
}) {
  const className = [
    styles.card,
    item.type === 'ai' ? styles.cardAi : '',
    expanded ? styles.cardExpanded : styles.cardCollapsed,
    slotClass,
    offstage ? styles.cardOff : '',
    snap ? styles.cardSnap : '',
  ]
    .filter(Boolean)
    .join(' ')

  const backgroundStyle: CSSProperties = {
    left: layout.left,
    width: layout.width,
    ...(item.type === 'ai' && item.gradient ? { background: item.gradient } : {}),
    ...(snap ? { transition: 'none', visibility: 'hidden' as const } : {}),
  }

  return (
    <article
      className={className}
      style={backgroundStyle}
      aria-label={`${item.domain}. ${item.title}`}
      aria-hidden={offstage}
      onClick={!expanded && !offstage ? onExpand : undefined}
    >
      <div className={styles.cardMedia} aria-hidden>
        {item.type === 'slides' && item.image ? <img src={item.image} alt="" /> : null}
        {item.type !== 'ai' ? <div className={styles.cardScrim} /> : null}
      </div>
      {item.type === 'chart' && item.chart && expanded ? (
        <div className={styles.chartPane}>
          <PopulationChart chart={item.chart} />
        </div>
      ) : null}
      <div className={styles.info}>
        <div className={styles.cardFooter}>
          {item.type === 'chart' && item.chart && !expanded ? (
            <div className={styles.chartSlot}>
              <PopulationChart chart={item.chart} />
            </div>
          ) : item.type === 'chart' && item.chart ? (
            <div className={`${styles.chartSlot} ${styles.chartSlotMobile}`}>
              <PopulationChart chart={item.chart} />
            </div>
          ) : null}
          <div className={styles.findingStack}>
            <p className={styles.cardDomain}>{item.domain}</p>
            <Finding before={item.before} highlight={item.highlight} after={item.after} />
          </div>
          <div
            className={styles.actions}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button type="button" className={styles.actionBtn}>
              <ChatText size={20} weight="regular" aria-hidden />
              Tell Me More
            </button>
            <VoteButton label="Show more like this" pressed={vote === 'up'} onClick={() => onVote('up')}>
              <ThumbsUp size={20} weight={vote === 'up' ? 'fill' : 'regular'} />
            </VoteButton>
            <VoteButton label="Not interested" pressed={vote === 'down'} onClick={() => onVote('down')}>
              <ThumbsDown size={20} weight={vote === 'down' ? 'fill' : 'regular'} />
            </VoteButton>
          </div>
        </div>
      </div>
      {item.type === 'slides' ? (
        <button
          type="button"
          className={styles.viewSlidesBtn}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          View Slides
          <ArrowRight size={20} weight="regular" aria-hidden />
        </button>
      ) : null}
    </article>
  )
}

export default function LandingHomeDefault() {
  const [filter, setFilter] = useState('All')
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [votes, setVotes] = useState<Record<string, 'up' | 'down' | null>>({})
  const [trackWidth, setTrackWidth] = useState(0)
  const [trackReady, setTrackReady] = useState(false)
  const [exiting, setExiting] = useState<number[]>([])
  const trackRef = useRef<HTMLDivElement>(null)
  const prevLayoutsRef = useRef<Record<string, CardLayout>>({})
  const generationRef = useRef<Record<string, number>>({})
  const exitTimersRef = useRef<Record<number, number>>({})
  const activeRef = useRef(0)

  const count = ATTENTION.length
  activeRef.current = active

  const goTo = useCallback((index: number) => {
    const current = activeRef.current
    const next = wrap(index, count)
    if (next === current) return
    const forward = wrap(next - current, count)
    const backward = wrap(current - next, count)
    if (forward > 0 && forward <= backward) {
      const leaving = Array.from({ length: forward }, (_, step) => wrap(current + step, count))
      setExiting((prev) => [...new Set([...prev, ...leaving])])
      for (const itemIndex of leaving) {
        window.clearTimeout(exitTimersRef.current[itemIndex])
        exitTimersRef.current[itemIndex] = window.setTimeout(() => {
          setExiting((prev) => prev.filter((value) => value !== itemIndex))
          delete exitTimersRef.current[itemIndex]
        }, CAROUSEL_MS)
      }
    }
    setActive(next)
  }, [count])

  useEffect(() => {
    const timers = exitTimersRef.current
    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const peekCount = trackWidth > 0 && trackWidth < 860 ? 0 : PEEK_COUNT
  const metrics = cardMetrics(trackWidth, peekCount)

  useLayoutEffect(() => {
    ATTENTION.forEach((item, index) => {
      const rel = wrap(index - active, count)
      const layout = carouselLayout(rel, metrics, exiting.includes(index), peekCount)
      prevLayoutsRef.current[item.id] = layout
    })
  }, [active, count, exiting, peekCount, trackWidth])

  useLayoutEffect(() => {
    const node = trackRef.current
    if (!node) return
    const apply = () => {
      setTrackWidth(node.clientWidth)
      setTrackReady(true)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!reduce.matches) return
    if (!playing) return
    const timer = window.setTimeout(() => goTo(active + 1), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [active, playing, goTo])

  return (
    <div className={styles.root} data-name="Landing">
      <header className={styles.nav}>
        <div className={styles.navTop}>
          <a className={styles.logo} href="#top" aria-label="Llumen home">
            <img className={styles.logoMark} src={a.logoMark} alt="" />
            <img className={styles.logoWord} src={a.wordmark} alt="Llumen" />
          </a>
          <label className={styles.search}>
            <MagnifyingGlass size={16} weight="regular" aria-hidden />
            <input type="search" placeholder="Search..." aria-label="Search" />
          </label>
          <div className={styles.navActions}>
            <button type="button" className={styles.pillBtn}>
              <GearSix size={20} weight="regular" aria-hidden />
              Studio
            </button>
            <button type="button" className={styles.pillBtn}>
              <Plus size={20} weight="regular" aria-hidden />
              Create
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Notifications">
              <Bell size={20} weight="regular" />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Account">
              <User size={20} weight="regular" />
            </button>
          </div>
        </div>
        <div className={styles.filters} aria-label="Workspace filters">
          {WORKSPACE_FILTERS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.pill}${filter === item.label ? ` ${styles.pillActive}` : ''}`}
              aria-pressed={filter === item.label}
              onClick={() => setFilter(item.label)}
            >
              <FilterIcon name={item.icon} />
              {item.label}
            </button>
          ))}
          <span className={styles.filterRule} aria-hidden />
          {CATEGORY_FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.pill}${filter === label ? ` ${styles.pillActive}` : ''}`}
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="attention-heading">
          <p id="attention-heading" className={styles.greeting}>
            Good morning, Your Excellency,
            <br />
            here is what requires your attention today
          </p>

          <div className={styles.carousel}>
            <div className={`${styles.track}${trackReady ? ` ${styles.trackReady}` : ''}`} ref={trackRef}>
              {ATTENTION.map((item, index) => {
                const rel = wrap(index - active, count)
                const leaving = exiting.includes(index)
                const layout = carouselLayout(rel, metrics, leaving, peekCount)
                const expanded = rel === 0 || leaving
                const offstage = isOffstage(layout, trackWidth)
                const snap = crossesOffstage(prevLayoutsRef.current[item.id], layout, trackWidth)
                if (snap) {
                  generationRef.current[item.id] = (generationRef.current[item.id] ?? 0) + 1
                }
                return (
                  <AttentionCard
                    key={`${item.id}-${generationRef.current[item.id] ?? 0}`}
                    item={item}
                    expanded={expanded}
                    slotClass={leaving || rel === 0 ? styles.cardHero : styles.cardPeek}
                    layout={layout}
                    offstage={offstage}
                    snap={snap}
                    onExpand={() => goTo(index)}
                    vote={votes[item.id] ?? null}
                    onVote={(value) =>
                      setVotes((prev) => ({
                        ...prev,
                        [item.id]: prev[item.id] === value ? null : value,
                      }))
                    }
                  />
                )
              })}
            </div>

            <div className={styles.controls}>
              <div className={styles.progress} role="tablist" aria-label="Attention items">
                {ATTENTION.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-label={`Attention ${index + 1}, ${item.type}: ${item.title}`}
                    aria-selected={index === active}
                    className={`${styles.dot}${index === active ? ` ${styles.dotActive}` : ''}${
                      index === active && !playing ? ` ${styles.dotPaused}` : ''
                    }`}
                    onClick={() => goTo(index)}
                  >
                    {index === active ? (
                      <span
                        className={styles.dotFill}
                        onAnimationEnd={() => {
                          if (playing) goTo(active + 1)
                        }}
                      />
                    ) : null}
                  </button>
                ))}
              </div>
              <div className={styles.ctrlGroup}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  aria-label="Previous"
                  onClick={() => goTo(active - 1)}
                >
                  <ArrowLeft size={20} weight="regular" />
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  aria-label={playing ? 'Pause' : 'Play'}
                  onClick={() => setPlaying((value) => !value)}
                >
                  {playing ? <Pause size={20} weight="regular" /> : <Play size={20} weight="regular" />}
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  aria-label="Next"
                  onClick={() => goTo(active + 1)}
                >
                  <ArrowRight size={20} weight="regular" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="recommended">
          <h2 id="recommended" className={styles.sectionEyebrow}>
            Recommended For you
          </h2>
          <div className={styles.storyGrid}>
            {RECOMMENDED.map((story) => (
              <article key={story.id} className={styles.storyCard}>
                <div className={styles.storyMedia}>
                  <img src={story.image} alt="" />
                </div>
                <div className={styles.storyBody}>
                  <span className={styles.storyCategory}>{story.category}</span>
                  <h3 className={styles.storyTitle}>{story.title}</h3>
                  <p className={styles.storyKind}>
                    {story.kind} / {story.sections}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
