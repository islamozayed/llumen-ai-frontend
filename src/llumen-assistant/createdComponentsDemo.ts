import type { AssistantReplyPayload, CreatedComponent } from './assistantReplyTypes'
import { DATA_FETCH_THINKING_STEPS } from './thinkingSteps'
import { buildStandardTimeline } from './standardTimeline'
import { llumenAssets } from './assets'

export const DEMO_CREATED_COMPONENTS: CreatedComponent[] = [
  {
    id: 'high-heat-districts',
    label: 'High-Heat Districts',
    type: 'visual',
    title: 'High-Heat Districts',
    semanticId: 'demand.high_heat_districts',
    description:
      'Quarterly demand trend across high-heat districts, totalling 7.6B AED with a +6.2% lift versus last quarter.',
    preview: {
      kind: 'image',
      src: llumenAssets.chartHighHeatDistricts,
      alt: 'High-Heat Districts quarterly trend chart',
    },
  },
  {
    id: 'price-gap-benchmark',
    label: 'Average Price Gap to Benchmark',
    type: 'kpi',
    title: 'Average Price Gap to Benchmark',
    semanticId: 'pricing.avg_gap_to_benchmark',
    description:
      'Average price gap to benchmark at 17.8pp, narrowing by 4.1pp versus last quarter.',
    preview: {
      kind: 'image',
      src: llumenAssets.chartPriceGapBenchmark,
      alt: 'Average Price Gap to Benchmark quarterly bar chart',
    },
  },
  {
    id: 'store-traffic-index',
    label: 'Store Traffic Index',
    type: 'visual',
    title: 'Store Traffic Index',
    semanticId: 'traffic.store_index',
    description:
      'Weekly footfall index across Marina corridor stores, up 12% versus the prior period.',
    preview: {
      kind: 'image',
      src: llumenAssets.mapStoreTrafficIndex,
      detailSrc: llumenAssets.mapBirdseyeDetail,
      detailView: 'map',
      alt: 'Store traffic heat map across Marina corridor',
      fit: 'cover',
    },
  },
  {
    id: 'returns-rate',
    label: 'Returns Rate',
    type: 'visual',
    title: 'Returns Rate',
    semanticId: 'ops.returns_rate',
    description:
      'Net returns as a share of gross sales for January, trending down 0.3pp month over month.',
    preview: {
      kind: 'image',
      src: llumenAssets.mapReturnsRate,
      detailSrc: llumenAssets.mapBirdseyeDetail,
      detailView: 'map',
      alt: 'Returns rate map by coastal district',
      fit: 'cover',
    },
  },
]

export function withCreatedComponents(reply: AssistantReplyPayload): AssistantReplyPayload {
  return {
    ...reply,
    createdComponents: DEMO_CREATED_COMPONENTS,
  }
}

export const COMPONENT_STREAM_SUFFIX =
  ' Select any created component below to open its preview in the panel.'

export const DATA_FETCH_STREAM = `I found several data sources and KPIs you can explore.${COMPONENT_STREAM_SUFFIX}`

export const DATA_FETCH_REPLY: AssistantReplyPayload = withCreatedComponents({
  thinkingSteps: DATA_FETCH_THINKING_STEPS,
  headline: 'Mapped available data sources and generated preview components you can inspect.',
  timeline: buildStandardTimeline(
    'which operational KPIs, sample datasets, and connected sources are available to explore in this workspace',
    'incident KPIs, traffic metrics, semantic models, and saved workspace components',
  ),
})
