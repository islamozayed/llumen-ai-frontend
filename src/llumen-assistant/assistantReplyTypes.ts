/**
 * Assistant reply copy model — surface vs technical:
 *
 * - Surface (headline, step titles, step body): plain English, outcome-first; avoid SQL,
 *   raw schema paths, subagent IDs, and implementation jargon.
 * - Technical blocks: short imperative labels ("Query run", "Tables used"); code/monospace OK;
 *   keep collapsed until the user expands.
 * - Streaming: the final user-facing answer streams into the summary block after the timeline
 *   finishes (`streamingText` prop in UI), not into step bodies.
 */

export type TechnicalFormat = 'sql' | 'json' | 'markdown' | 'plain'

export type TechnicalBlock = {
  label?: string
  format: TechnicalFormat
  content: string
}

export type TimelineStepKind = 'tool' | 'reasoning' | 'outcome'

export type TimelineStep = {
  id: string
  kind: TimelineStepKind
  /** Past-tense / completion label shown after the step finishes. */
  title: string
  /**
   * Present-tense line with trailing ellipsis, shown for ~2s while the step “runs” in the UI.
   * Omit to skip the progress phrase and show `title` immediately.
   */
  titleInProgress?: string
  body?: string
  technical?: TechnicalBlock | TechnicalBlock[]
  meta?: { resultCount?: number }
}

export type AssistantReplyPayload = {
  /**
   * Short affirming phrase (e.g. "Absolutely", "Got it") shown as:
   * "{confirmation}, let me work on this report for you." before the rest of the reply.
   */
  confirmation?: string
  headline: string
  /** Optional plain-English elaboration shown when the headline row is expanded. */
  headlineDetail?: string
  timeline: TimelineStep[]
}

/** Back-compat with older demo/API payloads */
export type LegacyAgentActivity = {
  id: string
  label: string
  status: 'complete' | 'active' | 'pending'
  depth?: number
}

export type LegacyThinkingPayload = {
  activities: LegacyAgentActivity[]
  planSummary: string
  planBody: string
}

export function legacyThinkingToReplyPayload(legacy: LegacyThinkingPayload): AssistantReplyPayload {
  const timeline: TimelineStep[] = legacy.activities.map((a) => ({
    id: `act-${a.id}`,
    kind: 'reasoning' as const,
    title: a.label,
  }))

  timeline.push({
    id: 'plan-technical',
    kind: 'tool',
    title: 'Prepared a structured runbook for validation',
    body: 'Open the technical view to see exact steps, datasources, and checks.',
    technical: {
      label: 'Agent execution plan',
      format: 'plain',
      content: legacy.planBody,
    },
  })

  return {
    headline: legacy.planSummary,
    timeline,
  }
}
