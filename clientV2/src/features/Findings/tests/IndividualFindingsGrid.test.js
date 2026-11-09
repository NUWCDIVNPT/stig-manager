import { screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import IndividualFindingsGrid from '../components/IndividualFindingsGrid.vue'

// The VirtualScroller renders no rows in JSDOM, so render each Column's body slot once per row
vi.mock('primevue/datatable', async () => {
  const { defineComponent, h, provide } = await import('vue')
  const RowScope = defineComponent({
    props: ['row'],
    inheritAttrs: false,
    setup(props, { slots }) {
      provide('mockRow', props.row)
      return () => slots.default?.()
    },
  })
  return {
    default: defineComponent({
      name: 'DataTable',
      props: ['value'],
      setup(props, { slots }) {
        return () => h('div', (props.value ?? []).map((row, i) => h(RowScope, { row, key: i }, () => slots.default?.())))
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

const row = {
  assetId: 'a1',
  assetName: 'web-01',
  ruleId: 'SV-1_rule',
  groupId: 'V-1',
  result: 'fail',
  status: { label: 'submitted' },
  assetLabelIds: [],
  stigs: [{ benchmarkId: 'RHEL_9', revisionStr: 'V2R1' }],
}

const Empty = { template: '<div />' }
const params = { collectionId: 'c1', assetId: 'a1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' }

describe('individualFindingsGrid Asset Review link', () => {
  let router

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Empty },
        { path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr', name: 'collection-asset-review', component: Empty },
      ],
    })
    await router.push('/')
    await router.isReady()
  })

  async function render(props) {
    renderWithProviders(IndividualFindingsGrid, {
      props: { rows: [row], collectionId: 'c1', selectedAggregated: { groupId: 'V-1' }, ...props },
      global: { plugins: [router] },
    })
    await flushPromises()
    return screen.queryByTitle('Open Asset Review')
  }

  const hrefFor = query => router.resolve({ name: 'collection-asset-review', params, query }).href

  it('links the label filter alongside ruleId', async () => {
    const link = await render({ selectedLabelNames: ['Alpha', null] })

    expect(link.getAttribute('href')).toBe(hrefFor({ labelMatch: 'null', labelName: ['Alpha'], ruleId: 'SV-1_rule' }))
  })

  it('links only ruleId when no labels are selected', async () => {
    const link = await render({ selectedLabelNames: [] })

    expect(link.getAttribute('href')).toBe(hrefFor({ ruleId: 'SV-1_rule' }))
  })

  it('renders no link when the row reports no STIG', async () => {
    const link = await render({ rows: [{ ...row, stigs: [] }] })

    expect(link).toBeNull()
  })
})
