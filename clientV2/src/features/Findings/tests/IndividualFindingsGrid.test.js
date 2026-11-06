import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import IndividualFindingsGrid from '../components/IndividualFindingsGrid.vue'

vi.mock('vue-router', () => ({ useRouter: vi.fn() }))

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

describe('individualFindingsGrid Asset Review link', () => {
  let mockPush

  beforeEach(() => {
    mockPush = vi.fn()
    useRouter.mockReturnValue({ push: mockPush })
  })

  async function openAssetReview(selectedLabelNames) {
    renderWithProviders(IndividualFindingsGrid, {
      props: { rows: [row], collectionId: 'c1', selectedAggregated: { groupId: 'V-1' }, selectedLabelNames },
    })
    await flushPromises()
    await fireEvent.click(screen.getByTitle('Open Asset Review'))
    return mockPush.mock.calls[0][0]
  }

  it('carries the label filter alongside ruleId', async () => {
    const to = await openAssetReview(['Alpha', null])

    expect(to).toEqual({
      name: 'collection-asset-review',
      params: { collectionId: 'c1', assetId: 'a1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' },
      query: { labelName: ['Alpha'], labelMatch: 'null', ruleId: 'SV-1_rule' },
    })
  })

  it('sends only ruleId when no labels are selected', async () => {
    const to = await openAssetReview([])

    expect(to.query).toEqual({ ruleId: 'SV-1_rule' })
  })
})
