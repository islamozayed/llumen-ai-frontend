import { landingAssets as a } from './landingAssets'

export type FindingSeverity = 'notice' | 'alert'

export type FindingToastItem = {
  id: string
  type: 'slides' | 'chart' | 'ai'
  title: string
  domain: string
  before: string
  highlight: string
  after: string
  image?: string
  gradient?: string
  /** Notices stack as toasts. Alerts take the intrusive aurora. */
  severity?: FindingSeverity
  /** Recommended-story id opened by "View slides". */
  storyId?: string
}

const FINDING_STORY_IDS: Record<string, string> = {
  'dumping-map': 'r1',
  'aqi-map': 'r2',
  'proactive-ai': 'r3',
  'ai-gradient-2': 'r4',
  'ai-gradient-4': 'r5',
  'ai-gradient-5': 'r6',
  'dumping-alert': 'r1',
  'aqi-alert': 'r2',
  'pressure-alert': 'r5',
}

export function relatedStoryId(item: { id: string; storyId?: string }): string | undefined {
  return item.storyId ?? FINDING_STORY_IDS[item.id]
}

const AI_GRADIENTS = [
  'linear-gradient(180deg, #4a4969 0%, #7072ab 50%, #cd82a0 100%)',
  'linear-gradient(180deg, #40405c 0%, #6f71aa 80%, #8a76ab 100%)',
  'linear-gradient(180deg, #757abf 0%, #8583be 60%, #eab0d1 100%)',
  'linear-gradient(180deg, #94c5f8 0%, #8ec0e8 25%, #7e9ad2 45%, #6d74bc 70%, #5a61ad 100%)',
  'linear-gradient(180deg, #9be2fe 0%, #67d1fb 22%, #2d8fb8 55%, #2478a0 100%)',
  'linear-gradient(180deg, #57c1eb 0%, #246fa8 100%)',
] as const

/** Pool of findings the `/finding` slash command cycles through. */
export const FINDING_TOAST_POOL: FindingToastItem[] = [
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
    id: 'proactive-ai',
    type: 'ai',
    title: 'Proactive Risk Digest',
    domain: 'Customer Success',
    before: 'Llumen flagged a clustered complaint pattern in MBZ City that typically precedes ',
    highlight: 'service-center delays of 40 minutes',
    after: ' within 72 hours',
    gradient: AI_GRADIENTS[2],
  },
  {
    id: 'ai-gradient-2',
    type: 'ai',
    title: 'Coastal Heat Stress Advisory',
    domain: 'Operations',
    before: 'Night-time temperatures along the corniche stayed above 32°C for a third consecutive week, with heat-related clinic visits ',
    highlight: 'up 22%',
    after: ' versus the seasonal baseline',
    gradient: AI_GRADIENTS[1],
  },
  {
    id: 'ai-gradient-4',
    type: 'ai',
    title: 'Water Network Pressure Review',
    domain: 'Engineering',
    before: 'Several districts in Al Ain recorded overnight pressure drops that typically precede ',
    highlight: 'service interruptions of 4–6 hours',
    after: ' within the next 48 hours',
    gradient: AI_GRADIENTS[3],
  },
  {
    id: 'ai-gradient-5',
    type: 'ai',
    title: 'School-Zone Congestion Watch',
    domain: 'Customer Success',
    before: 'Pickup queues at three model schools in Khalifa City stretched past ',
    highlight: '18 minutes at close',
    after: ", doubling last month's average wait",
    gradient: AI_GRADIENTS[4],
  },
]

export type FindingToastInstance = FindingToastItem & {
  /** Unique per push so the same finding can stack more than once. */
  instanceId: string
}

export function isFindingSlashCommand(text: string): boolean {
  return /^\/finding(?:\s|$)/i.test(text.trim())
}

export function nextFindingFromPool(index: number): FindingToastItem {
  return FINDING_TOAST_POOL[index % FINDING_TOAST_POOL.length]
}

/** Huge alerts. These are the only findings that spawn the aurora. */
export const ALERT_FINDING_POOL: FindingToastItem[] = [
  {
    id: 'dumping-alert',
    type: 'ai',
    severity: 'alert',
    title: 'Illegal dumping surge',
    domain: 'Public Safety',
    before: 'Illegal dumping along the Mussafah industrial belt has ',
    highlight: 'spiked 35% in six hours',
    after: ', and three sites are now above the emergency threshold',
  },
  {
    id: 'aqi-alert',
    type: 'ai',
    severity: 'alert',
    title: 'Air quality emergency',
    domain: 'Operations',
    before: 'Fine particulate readings across the coastal corridor have ',
    highlight: 'crossed the hazardous band',
    after: ', with schools and clinics inside the plume',
  },
  {
    id: 'pressure-alert',
    type: 'ai',
    severity: 'alert',
    title: 'Water network failure',
    domain: 'Engineering',
    before: 'Overnight pressure in Al Ain has ',
    highlight: 'collapsed across four districts',
    after: ', and interruptions of 4–6 hours are already underway',
  },
]

export function nextAlertFromPool(index: number): FindingToastItem {
  return ALERT_FINDING_POOL[index % ALERT_FINDING_POOL.length]
}

export function isAlertFinding(item: { severity?: FindingSeverity }): boolean {
  return item.severity === 'alert'
}

/** How many findings `/finding` seeds when the stack is empty. */
export const FINDING_TOAST_SEED_COUNT = 5
