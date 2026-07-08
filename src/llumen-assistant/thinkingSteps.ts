import type { ThinkingStep, TimelineStep } from './assistantReplyTypes'

export function thinkingStepsFromTimeline(timeline: TimelineStep[]): ThinkingStep[] {
  const steps: ThinkingStep[] = timeline
    .filter((step) => step.kind !== 'outcome')
    .map((step) => ({
      id: `think-${step.id}`,
      kind: step.kind === 'tool' ? ('search' as const) : ('reasoning' as const),
      title: step.title,
      description: step.body ?? step.subtitle,
    }))

  steps.push({
    id: 'think-done',
    kind: 'done',
    title: 'Done',
    description: 'Ready to share a concise answer.',
  })

  return steps
}

export const DEMO_THINKING_STEPS: ThinkingStep[] = [
  {
    id: 'think-intent',
    kind: 'reasoning',
    title: 'Understanding the January revenue question',
    description:
      'Interpreted your question as net store sales for the calendar month, aligned with how leadership dashboards define brick-and-mortar revenue.',
  },
  {
    id: 'think-schema',
    kind: 'search',
    title: 'Mapping retail semantic models and warehouse tables',
    description:
      'Matched the request to store_sales_monthly, dim_channel, and dim_calendar so the total can be audited against the executive P&L view.',
  },
  {
    id: 'think-filters',
    kind: 'reasoning',
    title: 'Narrowed to stores and applied return rules',
    description:
      'Filtered out online fulfillment, applied the standard 30-day return window, and sanity-checked row counts before reading the total.',
  },
  {
    id: 'think-done',
    kind: 'done',
    title: 'Done',
    description: 'Prepared a shareable summary you can paste into a briefing or follow-up thread.',
  },
]

export const DATA_FETCH_THINKING_STEPS: ThinkingStep[] = [
  {
    id: 'think-intent',
    kind: 'reasoning',
    title: 'Understanding what data you want to explore',
    description:
      'Treated the prompt as a catalog lookup across operational KPIs, sample datasets, and visuals already in your workspace.',
  },
  {
    id: 'think-components',
    kind: 'search',
    title: 'Searching existing components and semantic models',
    description: 'Indexed saved KPIs, sample tables, and published visuals that match incident and traffic domains.',
  },
  {
    id: 'think-sources',
    kind: 'search',
    title: 'Analyzing connected data sources',
    description:
      'Validated live connections, checked schema coverage, and confirmed which domains can be queried without extra setup.',
  },
  {
    id: 'think-query',
    kind: 'reasoning',
    title: 'Running a lightweight validation query',
    description: 'Pulled a small result set to confirm row shape and freshness before generating preview components.',
  },
  {
    id: 'think-done',
    kind: 'done',
    title: 'Done',
    description: 'Packaged fetchable sources into reviewable components below.',
  },
]
