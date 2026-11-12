import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import MetricsSummaryGrid from '../MetricsSummaryGrid.vue'

// The VirtualScroller renders no rows in JSDOM, so render each Column's body slot once per row.
// A click anywhere in a row selects it, as PrimeVue's row click does.
vi.mock('primevue/datatable', async () => {
  const { defineComponent, h, provide } = await import('vue')
  const Row = defineComponent({
    props: ['row'],
    emits: ['select'],
    setup(props, { slots, emit }) {
      provide('mockRow', props.row)
      return () => h('div', { 'data-testid': 'row', 'onClick': () => emit('select') }, slots.default?.())
    },
  })
  return {
    default: defineComponent({
      name: 'DataTable',
      props: ['value'],
      emits: ['row-select'],
      setup(props, { slots, emit }) {
        return () => h('div', (props.value ?? []).map((row, i) =>
          h(Row, { row, key: i, onSelect: () => emit('row-select', { data: row }) }, () => slots.default?.())))
      },
    }),
  }
})
vi.mock('primevue/column', async () => {
  const { defineComponent, inject } = await import('vue')
  return {
    default: defineComponent({
      name: 'Column',
      inheritAttrs: false,
      setup(_, { slots }) {
        const row = inject('mockRow', null)
        return () => (row && slots.body ? slots.body({ data: row }) : null)
      },
    }),
  }
})

const metrics = {
  assessments: 10,
  assessed: 5,
  minTs: '2026-01-01T00:00:00Z',
  maxTs: '2026-02-01T00:00:00Z',
  maxTouchTs: '2026-02-01T00:00:00Z',
  statuses: { saved: 2, submitted: 1, accepted: 1, rejected: 0 },
  results: { pass: 3, fail: 1, notapplicable: 1, other: 5 },
  findings: { low: 1, medium: 1, high: 1 },
  assessmentsBySeverity: { low: 3, medium: 4, high: 3 },
  assessedBySeverity: { low: 2, medium: 2, high: 1 },
}

const stigRows = [
  { benchmarkId: 'RHEL_9', revisionStr: 'V2R1', metrics },
  { benchmarkId: 'Win_11', revisionStr: 'V1R3', metrics },
]
const checklistRows = [{ assetId: 'a1', name: 'web-01', labels: [], benchmarkId: 'RHEL_9', revisionStr: 'V2R1', metrics }]
const collectionRows = [{ collectionId: 'c1', name: 'Coll 1', metrics }]

const Empty = { template: '<div />' }
let router

beforeEach(async () => {
  localStorage.clear()
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Empty },
      { path: '/collection/:collectionId/stigs', name: 'collection-stigs', component: Empty },
      { path: '/collection/:collectionId/benchmark/:benchmarkId/revision/:revisionStr', name: 'collection-benchmark-review', component: Empty },
      { path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr', name: 'collection-asset-review', component: Empty },
    ],
  })
  await router.push('/')
  await router.isReady()
})

function renderGrid(props) {
  return renderWithProviders(MetricsSummaryGrid, { props, global: { plugins: [router] } })
}

const stigReviewTo = row => ({
  name: 'collection-benchmark-review',
  params: { collectionId: 'c1', benchmarkId: row.benchmarkId, revisionStr: row.revisionStr },
  query: { labelName: 'web' },
})
const hrefs = title => screen.queryAllByTitle(title).map(a => a.getAttribute('href'))

describe('metricsSummaryGrid row links', () => {
  it('links each STIG row\'s shield to its own target', () => {
    renderGrid({ apiMetricsSummary: stigRows, aggType: 'stig', shieldTo: stigReviewTo })

    expect(hrefs('Open Benchmark Review')).toEqual([
      '/collection/c1/benchmark/RHEL_9/revision/V2R1?labelName=web',
      '/collection/c1/benchmark/Win_11/revision/V1R3?labelName=web',
    ])
  })

  it('links the asset shield on a checklist row', () => {
    const shieldTo = row => ({
      name: 'collection-asset-review',
      params: { collectionId: 'c1', assetId: row.assetId, benchmarkId: row.benchmarkId, revisionStr: row.revisionStr },
    })
    renderGrid({ apiMetricsSummary: checklistRows, aggType: 'unagg', parentAggType: 'stig', shieldTo })

    expect(hrefs('Open Asset Review')).toEqual(['/collection/c1/asset/a1/stig/RHEL_9/revision/V2R1'])
  })

  it('links both the collection icon and the shield on a collection row', () => {
    renderGrid({
      apiMetricsSummary: collectionRows,
      aggType: 'collection',
      collectionIconTo: row => ({ name: 'collection-stigs', params: { collectionId: row.collectionId } }),
      shieldTo: row => ({ name: 'collection-benchmark-review', params: { collectionId: row.collectionId, benchmarkId: 'RHEL_9', revisionStr: 'V2R1' } }),
    })

    expect(hrefs('Go to Collection')).toEqual(['/collection/c1/stigs'])
    expect(hrefs('Open Collection')).toEqual(['/collection/c1/benchmark/RHEL_9/revision/V2R1'])
  })

  it('renders no links without targets', () => {
    renderGrid({ apiMetricsSummary: collectionRows, aggType: 'collection' })

    expect(screen.queryByRole('link')).toBeNull()
  })

  it('skips the link on a row whose target is null', () => {
    renderGrid({ apiMetricsSummary: stigRows, aggType: 'stig', shieldTo: row => (row.benchmarkId === 'RHEL_9' ? stigReviewTo(row) : null) })

    expect(hrefs('Open Benchmark Review')).toEqual(['/collection/c1/benchmark/RHEL_9/revision/V2R1?labelName=web'])
  })

  it('navigates on a shield click without selecting the row', async () => {
    const { emitted } = renderGrid({ apiMetricsSummary: stigRows, aggType: 'stig', selectable: true, shieldTo: stigReviewTo })

    await fireEvent.click(screen.getAllByTitle('Open Benchmark Review')[0])
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/collection/c1/benchmark/RHEL_9/revision/V2R1?labelName=web')
    expect(emitted()['row-select']).toBeUndefined()
  })

  it('still selects the row on a click outside the shield', async () => {
    const { emitted } = renderGrid({ apiMetricsSummary: stigRows, aggType: 'stig', selectable: true, shieldTo: stigReviewTo })

    await fireEvent.click(screen.getAllByTestId('row')[0])

    expect(emitted()['row-select'][0][0]).toMatchObject({ benchmarkId: 'RHEL_9' })
    expect(router.currentRoute.value.name).toBe('home')
  })
})
