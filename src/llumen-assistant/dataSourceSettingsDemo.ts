import type { CreatedComponent } from './assistantReplyTypes'

export type DataSourceSectionId = 'basic' | 'details' | 'schema' | 'status'

export type DataSourceStaticField =
  | { kind: 'value'; label: string; value: string }
  | { kind: 'description'; label: string; value: string }
  | { kind: 'toggle'; label: string; enabled: boolean }

export type DataSourceStaticSection = {
  title: string
  fields: DataSourceStaticField[]
}

export type DataSourceConfig = {
  sourceName: string
  sourceType: string
  nav: { id: DataSourceSectionId; label: string }[]
  sections: Partial<Record<DataSourceSectionId, DataSourceStaticSection[]>>
}

const AIMSUN_DATA_SOURCE: DataSourceConfig = {
  sourceName: 'Aimsun',
  sourceType: 'PostgreSQL',
  nav: [
    { id: 'basic', label: 'Basic' },
    { id: 'details', label: 'Connection' },
    { id: 'status', label: 'Status' },
  ],
  sections: {
    basic: [
      {
        title: 'Basic Information',
        fields: [
          { kind: 'value', label: 'Name', value: 'Aimsun' },
          {
            kind: 'description',
            label: 'Description',
            value:
              'Traffic management data for road network. Includes road sections with geometry, sensors (locations and time-series), incidents and events, response plans, and AI/simulation predictions. Used for traffic monitoring, incident handling, and network analysis.',
          },
          { kind: 'value', label: 'Database Type', value: 'PostgreSQL' },
        ],
      },
    ],
    details: [
      {
        title: 'Connection Details',
        fields: [
          { kind: 'toggle', label: 'Use connection string', enabled: false },
          { kind: 'value', label: 'Host', value: 'localhost' },
          { kind: 'value', label: 'Port', value: '5432' },
          { kind: 'value', label: 'Database Name', value: 'Not configured' },
          { kind: 'value', label: 'Schema', value: 'public' },
        ],
      },
    ],
    status: [
      {
        title: 'Connection Status',
        fields: [
          { kind: 'value', label: 'User Status', value: 'Active' },
          { kind: 'value', label: 'Agent Status', value: 'Active' },
          { kind: 'value', label: 'Last Tested', value: 'Apr 21, 2026, 09:38 PM' },
        ],
      },
    ],
  },
}

const LARGE_SHAPES_DATA_SOURCE: DataSourceConfig = {
  sourceName: 'large-shapes-test',
  sourceType: 'Geojson',
  nav: [
    { id: 'basic', label: 'Basic' },
    { id: 'details', label: 'File' },
    { id: 'schema', label: 'Schema' },
    { id: 'status', label: 'Status' },
  ],
  sections: {
    basic: [
      {
        title: 'Basic Information',
        fields: [
          { kind: 'value', label: 'Name', value: 'large-shapes-test' },
          {
            kind: 'description',
            label: 'Description',
            value: 'PostgreSQL Store table from large-shapes-test.geojson',
          },
          { kind: 'value', label: 'File Type', value: 'Geojson' },
        ],
      },
    ],
    details: [
      {
        title: 'Uploaded Datasource',
        fields: [
          { kind: 'value', label: 'Source file', value: 'large-shapes-test.geojson' },
          { kind: 'value', label: 'Ingestion kind', value: 'tabular' },
          { kind: 'value', label: 'Rows ingested', value: '6' },
          { kind: 'value', label: 'Store schema', value: 'uploads' },
          {
            kind: 'value',
            label: 'Store table',
            value: 'uploads.ds_51ff57a44b624a5c8b64a7e13c203053_v1',
          },
          {
            kind: 'value',
            label: 'Primary preview table',
            value: 'uploads.ds_51ff57a44b624a5c8b64a7e13c203053_v1',
          },
        ],
      },
    ],
    schema: [
      {
        title: 'Schema Overview',
        fields: [
          { kind: 'value', label: 'Engine', value: 'Postgresql' },
          { kind: 'value', label: 'Tables', value: '1' },
          { kind: 'value', label: 'Relationships', value: '0' },
          { kind: 'value', label: 'Namespaces', value: '1' },
          { kind: 'value', label: 'Rows', value: '6' },
          { kind: 'value', label: 'Generated', value: 'Jul 8, 2026, 5:12 PM' },
        ],
      },
      {
        title: 'Top Tables',
        fields: [
          {
            kind: 'value',
            label: 'uploads.ds_51ff57a44b624a5c8b64a7e13c203053_v1',
            value: '6 rows',
          },
        ],
      },
      {
        title: 'Namespaces',
        fields: [{ kind: 'value', label: 'Namespace', value: 'uploads' }],
      },
    ],
    status: [
      {
        title: 'Connection Status',
        fields: [
          { kind: 'value', label: 'User Status', value: 'Active' },
          { kind: 'value', label: 'Agent Status', value: 'Active' },
          { kind: 'value', label: 'Last Tested', value: 'Jun 29, 2024, 08:41 PM' },
        ],
      },
    ],
  },
}

export function getDataSourceConfig(component: CreatedComponent): DataSourceConfig | null {
  if (component.id === 'high-heat-districts') return AIMSUN_DATA_SOURCE
  if (component.id === 'price-gap-benchmark') return LARGE_SHAPES_DATA_SOURCE
  return null
}
