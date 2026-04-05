import type { AssistantReplyPayload } from './assistantReplyTypes'

export type ProactiveScenario = {
  id: string
  /** Copy shown on the proactive chip */
  suggestion: string
  /** Rephrased user request injected as a sent message */
  userMessage: string
  streamAnswer: string
  reply: AssistantReplyPayload
}

const technicalBriefingOutline = {
  label: 'Briefing structure',
  format: 'plain' as const,
  content:
    'sections: executive_snapshot, jan_2026_store_total, definitions_dashboard_parity, appendix_sources\ncadence: share_now | leadership_distribution_list | pdf + tracked_link',
}

export const PROACTIVE_SCENARIOS: readonly ProactiveScenario[] = [
  {
    id: 'briefing-leadership',
    suggestion:
      'Would you like me to create a briefing and share it with top leadership with those findings?',
    userMessage:
      'Please create an executive briefing from those January store sales findings and share it with our top leadership team.',
    streamAnswer:
      "I've drafted a concise leadership briefing that opens with the $4.2M January net store-sales figure, spells out how it matches your exec dashboards, and adds three takeaways your team can paste into email. It's queued to your senior leadership distribution list with open tracking—tell me if you want a shorter version or different names on the To line.",
    reply: {
      confirmation: 'Understood',
      headline: 'Packaging your January store results into a leadership-ready briefing and staging distribution.',
      headlineDetail:
        'Pulling forward the verified numbers and definitions from our last answer so executives see one coherent story, not a re-litigation of methodology.',
      timeline: [
        {
          id: 'brief-pull-context',
          kind: 'tool',
          titleInProgress: 'Pulling the narrative, figures, and definitions from your last answer…',
          title: 'Consolidated the figures and definitions into a briefing scaffold',
          body: 'Anchored on the same $4.2M January net store-total, store-channel grain, and return rules we already validated so leadership sees continuity, not a new definition.',
          technical: [
            technicalBriefingOutline,
            {
              label: 'Source recap',
              format: 'markdown' as const,
              content:
                '- **Metric:** net store sales, January 2026, returns netted within policy window\n- **Scope:** Dubai Marina included in regional rollup\n- **Parity:** exec store P&L monthly surface',
            },
          ],
        },
        {
          id: 'brief-format',
          kind: 'tool',
          titleInProgress: 'Formatting sections, highlights, and exec-friendly phrasing…',
          title: 'Formatted the briefing for executive readers',
          body: 'Structured as snapshot, what changed vs prior month (placeholder for your ops team), risks / data caveats, and a one-line ask—kept under two pages.',
          meta: { resultCount: 2 },
          technical: [
            {
              label: 'Template',
              format: 'plain' as const,
              content: 'template: leadership_brief_v3\nbrand_tokens: inherited from workspace\ncharts: optional sparkline slot (not inserted in this pass)',
            },
          ],
        },
        {
          id: 'brief-tone',
          kind: 'reasoning',
          titleInProgress: 'Tightening tone and checking length for a senior audience…',
          title: 'Calibrated tone and length for leadership',
          body: 'Removed implementation jargon, surfaced the single headline number first, and flagged where to add a human-forward comment before you hit send.',
        },
        {
          id: 'brief-outcome',
          kind: 'outcome',
          titleInProgress: 'Staging distribution and delivery…',
          title: 'Ready to share with leadership',
          body: '',
        },
      ],
    },
  },
  {
    id: 'regional-compare',
    suggestion:
      'Want a regional breakdown for the same period, or compare Dubai Marina to your other hubs?',
    userMessage:
      'Please give me a regional breakdown for the same January 2026 period and compare Dubai Marina to our other major hubs.',
    streamAnswer:
      'Here is the regional cut: January net store sales split by hub with Dubai Marina called out against your next three locations. Marina paces about 8% above the cohort average on the same store-channel basis—say if you want this exported as a table or limited to GCC only.',
    reply: {
      confirmation: 'Got it',
      headline: 'Breaking January 2026 store performance out by region and benchmarking Dubai Marina against peer hubs.',
      headlineDetail:
        'Same semantic model and return rules as before; differences are pure geography and hub groupings.',
      timeline: [
        {
          id: 'reg-pull',
          kind: 'tool',
          titleInProgress: 'Pulling January store-channel totals by hub and region…',
          title: 'Pulled regional hub-level totals for January 2026',
          body: 'Each hub uses the same net-of-returns store definition; online / ship-from-store remain excluded for parity with your executive view.',
          technical: [
            {
              label: 'Grain',
              format: 'plain' as const,
              content: 'grain: calendar_month × hub × channel(store)\nperiod: 2026-01',
            },
          ],
        },
        {
          id: 'reg-compare',
          kind: 'tool',
          titleInProgress: 'Building Dubai Marina vs peer-hub comparison…',
          title: 'Built a Dubai Marina vs peer-hub comparison',
          body: 'Ranked hubs on net sales and variance vs cohort average; Marina flagged for follow-up commentary if you present live.',
          meta: { resultCount: 4 },
        },
        {
          id: 'reg-sanity',
          kind: 'reasoning',
          titleInProgress: 'Normalizing currency and checking rollups…',
          title: 'Sanity-checked rollups before sharing',
          body: 'Verified subtotals reconcile to the January global store number you already saw; no double-count on cross-border transfers.',
        },
        {
          id: 'reg-outcome',
          kind: 'outcome',
          titleInProgress: 'Drafting how you can present this…',
          title: 'What you can share back',
          body: '',
        },
      ],
    },
  },
  {
    id: 'exec-onepager',
    suggestion: 'Should I draft a one-page exec summary with charts you can paste into Slack or email?',
    userMessage:
      'Please draft a one-page executive summary with charts I can paste into Slack or email.',
    streamAnswer:
      "Here's a single-page layout: headline metric, two sparkline-friendly series (last 6 months / YoY), and a tight bullet block for Slack. I've kept sources in the footer so you can screenshot or export PNG—happy to swap chart types if your brand kit prefers bars.",
    reply: {
      confirmation: 'On it',
      headline: 'Assembling a one-page exec summary with chart slots matched to your dashboard semantics.',
      headlineDetail: 'Figures still tied to the January analysis; charts are sized for paste-into-Slack and email.',
      timeline: [
        {
          id: 'page-pick-charts',
          kind: 'tool',
          titleInProgress: 'Selecting chart tiles that match your dashboard semantics…',
          title: 'Selected chart tiles aligned to exec dashboards',
          body: 'Chose a trend strip for net store sales and a simple hub comparison tile—both pull the same measures leadership already trusts.',
        },
        {
          id: 'page-layout',
          kind: 'tool',
          titleInProgress: 'Laying out the one-pager in your workspace template…',
          title: 'Laid out the one-pager in the standard template',
          body: 'Margins and typography follow your internal doc spec; chart placeholders are vector so exports stay crisp.',
          technical: [
            {
              label: 'Export',
              format: 'json' as const,
              content: '{"formats": ["slack_png", "pdf", "link_share"], "default": "slack_png"}',
            },
          ],
        },
        {
          id: 'page-parity',
          kind: 'reasoning',
          titleInProgress: 'Reconciling chart data to the January headline total…',
          title: 'Reconciled visuals to the headline total',
          body: 'Spot-checked aggregates so the $4.2M anchor and the chart totals tell one story.',
        },
        {
          id: 'page-outcome',
          kind: 'outcome',
          titleInProgress: 'Finalizing copy you can paste…',
          title: 'Ready to paste or export',
          body: '',
        },
      ],
    },
  },
]

export function getProactiveScenarioById(id: string): ProactiveScenario | undefined {
  return PROACTIVE_SCENARIOS.find((s) => s.id === id)
}
