/**
 * Figma: Landing — Home — Default (node 7149:8731)
 * https://www.figma.com/design/gGAXWwuoHrfYmZEBAt9T1g/Lumen-UI?node-id=7149-8731
 *
 * Raster assets are vendored under public/llumen-assets/landing (not Figma MCP URLs).
 * Page background comes from CompactAssistantDemo MeshGradient — do not paint a solid/shader bg here.
 */
import {
  Bell,
  CaretDown,
  DotsThreeVertical,
  EyeSlash,
  MagnifyingGlass,
  Play,
  Plus,
  SquaresFour,
  StarFour,
  Users,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { landingAssets as a } from './landingAssets'
import styles from './LandingHome.module.css'

const WORKSPACE_FILTERS = ['All', 'Private', 'Shared With me'] as const
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

const BRIEFINGS = [
  {
    id: 'ops',
    tag: 'Feedback',
    tagTone: 'feedback' as const,
    domain: 'Operations',
    title: 'Supply Chain Alert: Critical Something And something even more stuff going',
    time: '2 Hours Ago',
    image: a.createBriefingCta1,
    tagIcon: a.vectorOps,
  },
  {
    id: 'it',
    tag: 'Update',
    tagTone: 'update' as const,
    domain: 'IT',
    title: 'Supply Chain Alert: Critical Something And something even more stuff going',
    time: 'Yesterday',
    image: a.createBriefingCta2,
    tagIcon: a.vectorIt,
  },
]

const FEATURED_THUMBS = [
  { src: a.featuredMap, active: true },
  { src: a.image115, active: false },
  { src: a.image116, active: false },
]

const RECOMMENDED = [
  {
    id: 'r1',
    category: 'Finance',
    title: 'Q2 Performance Review: Deep Dive into Financial Metrics Across All Deparments',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image117,
  },
  {
    id: 'r2',
    category: 'Operations',
    title: 'Supply Chain Resilience: Mapping Critical Vendor Dependencies and Risk',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image118,
  },
  {
    id: 'r3',
    category: 'HR',
    title: 'Workforce Planning 2025: Attrition Hotspots and Hiring Capacity Outlook',
    kind: 'Story',
    sections: '12 Sections',
    image: a.image119,
  },
  {
    id: 'r4',
    category: 'Sales',
    title: 'Pipeline Health Check: Conversion Trends Across Priority Accounts',
    kind: 'Dashboard',
    sections: '8 Sections',
    image: a.image120,
  },
  {
    id: 'r5',
    category: 'Marketing',
    title: '2025 Marketing Strategy Overview: Key Initiatives and Anticipated Impact Analysis',
    kind: 'Story',
    sections: '19 Sections',
    image: a.image116,
  },
  {
    id: 'r6',
    category: 'IT',
    title: 'IT Infrastructure Monitoring: Real-time Network Health and Security Alerts',
    kind: 'Dashboard',
    sections: '19 Sections',
    image: a.image121,
  },
]

function Pill({
  children,
  active = false,
  icon,
}: {
  children: ReactNode
  active?: boolean
  icon?: ReactNode
}) {
  return (
    <button type="button" className={`${styles.pill}${active ? ` ${styles.pillActive}` : ''}`}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

export default function LandingHomeDefault() {
  return (
    <div className={styles.root} data-name="Landing - Home - Default">
      <header className={styles.nav}>
        <div className={styles.navTop}>
          <div className={styles.logo}>
            <span className={styles.logoMark} aria-hidden>
              L
            </span>
            <span className={styles.logoWord}>Llumen</span>
          </div>
          <nav className={styles.navLinks} aria-label="Primary">
            <a className={styles.navLinkActive} href="#workspaces">
              My Workspaces
            </a>
            <a className={styles.navLink} href="#explore">
              Explore
            </a>
          </nav>
          <div className={styles.navActions}>
            <button type="button" className={styles.iconBtn} aria-label="Search">
              <MagnifyingGlass size={20} weight="regular" />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Notifications">
              <Bell size={20} weight="regular" />
            </button>
            <button type="button" className={styles.userBtn} aria-label="Account menu">
              <img className={styles.avatar} src={a.userBtn} alt="" />
              <CaretDown size={16} weight="bold" aria-hidden />
            </button>
          </div>
        </div>

        <div className={styles.filters} aria-label="Workspace filters">
          <Pill icon={<Plus size={16} weight="regular" aria-hidden />}>New</Pill>
          <span className={styles.filterRule} aria-hidden />
          {WORKSPACE_FILTERS.map((label) => (
            <Pill
              key={label}
              active={label === 'All'}
              icon={
                label === 'All' ? (
                  <SquaresFour size={18} weight="regular" aria-hidden />
                ) : label === 'Private' ? (
                  <EyeSlash size={18} weight="regular" aria-hidden />
                ) : (
                  <Users size={18} weight="regular" aria-hidden />
                )
              }
            >
              {label}
            </Pill>
          ))}
          <span className={styles.filterRule} aria-hidden />
          <div className={styles.filterScroll}>
            {CATEGORY_FILTERS.map((label) => (
              <Pill key={label}>{label}</Pill>
            ))}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section} aria-labelledby="latest-briefings">
          <h2 id="latest-briefings" className={styles.sectionEyebrow}>
            Latest Briefings
          </h2>
          <div className={styles.briefingRow}>
            <button type="button" className={styles.createBriefing}>
              <span className={styles.createBriefingBg} aria-hidden>
                <img src={a.createBriefingCta} alt="" />
              </span>
              <Plus size={40} weight="regular" aria-hidden />
              <span className={styles.createBriefingLabel}>
                Create
                <br />
                Briefing
              </span>
            </button>

            {BRIEFINGS.map((card) => (
              <article key={card.id} className={styles.briefingCard}>
                <img className={styles.briefingImage} src={card.image} alt="" />
                <div className={styles.briefingOverlay}>
                  <div className={styles.briefingTop}>
                    <span
                      className={`${styles.briefingTag} ${
                        card.tagTone === 'feedback' ? styles.tagFeedback : styles.tagUpdate
                      }`}
                    >
                      <img src={card.tagIcon} alt="" />
                      {card.tag}
                    </span>
                    <button type="button" className={styles.menuBtn} aria-label="More options">
                      <DotsThreeVertical size={18} weight="bold" />
                    </button>
                  </div>
                  <div className={styles.briefingMeta}>
                    <p className={styles.briefingDomain}>{card.domain}</p>
                    <p className={styles.briefingTitle}>{card.title}</p>
                    <p className={styles.briefingTime}>{card.time}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.featured} aria-labelledby="featured-live">
          <img className={styles.featuredMap} src={a.featuredMap} alt="" />
          <div className={styles.featuredBlur} aria-hidden />
          <div className={styles.featuredCopy}>
            <h2 id="featured-live" className={styles.sectionEyebrow}>
              Featured live experiences
            </h2>
            <div className={styles.featuredBody}>
              <h3 className={styles.featuredTitle}>
                Product Roadmap 2025: Innovations &amp; User Experience
              </h3>
              <div className={styles.featuredSummaryLabel}>
                <StarFour size={18} weight="fill" aria-hidden />
                Executive Summary
              </div>
              <p className={styles.featuredSummary}>
                Over the last 90 days, resident satisfaction declined and effort increased in key
                districts like MBZ City and Shakhbout City. Service centers in these areas face longer
                waits, higher errors, and complaints around parking and rescheduling, with healthcare
                capacity also under strain.
              </p>
              <p className={styles.featuredSections}>4 Sections</p>
            </div>
            <button type="button" className={styles.startBtn}>
              <Play size={22} weight="fill" aria-hidden />
              Start
            </button>
          </div>
          <div className={styles.featuredThumbs} role="tablist" aria-label="Featured views">
            {FEATURED_THUMBS.map((thumb, i) => (
              <button
                key={thumb.src}
                type="button"
                role="tab"
                aria-selected={thumb.active}
                className={`${styles.featuredThumb}${thumb.active ? ` ${styles.featuredThumbActive}` : ''}`}
              >
                <img src={thumb.src} alt={`Featured view ${i + 1}`} />
              </button>
            ))}
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
                  <div className={styles.storyMediaTop}>
                    <button type="button" className={styles.menuBtn} aria-label="More options">
                      <DotsThreeVertical size={18} weight="bold" />
                    </button>
                  </div>
                </div>
                <div className={styles.storyBody}>
                  <span className={styles.storyCategory}>{story.category}</span>
                  <h3 className={styles.storyTitle}>{story.title}</h3>
                  <p className={styles.storyKind}>
                    {story.kind} <span aria-hidden>/</span> {story.sections}
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
