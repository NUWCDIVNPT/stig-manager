import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { fetchRule } from '../api/assetReviewApi.js'
import { useRuleDetail } from '../composables/useRuleDetail.js'

vi.mock('../api/assetReviewApi.js', () => ({
  fetchRule: vi.fn(),
}))

function setup({ ruleId = null, benchmarkId = 'RHEL_9', revisionStr = 'V2R1', selectedRuleId } = {}) {
  const bId = ref(benchmarkId)
  const rev = ref(revisionStr)
  const ruleLookupMap = ref(new Map([['SV-1', { ruleId: 'SV-1' }], ['SV-2', { ruleId: 'SV-2' }]]))
  const result = useRuleDetail({ ruleLookupMap, benchmarkId: bId, revisionStr: rev, selectedRuleId: selectedRuleId ?? ref(ruleId) })
  return { bId, rev, ruleLookupMap, ...result }
}

describe('useRuleDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchRule.mockImplementation(async (b, r, id) => ({ ruleId: id, title: `${b} ${r} ${id}` }))
  })

  it('uses the selection ref it is given (Asset Review passes one kept in ?ruleId)', () => {
    const selectedRuleId = ref('SV-1')
    const { selectedRuleId: returned } = setup({ selectedRuleId })
    expect(returned).toBe(selectedRuleId)
  })

  it('loads a rule that is already selected when it starts (restored from the URL)', async () => {
    const { ruleContent } = setup({ ruleId: 'SV-1' })
    await flushPromises()
    expect(fetchRule).toHaveBeenCalledWith('RHEL_9', 'V2R1', 'SV-1')
    expect(ruleContent.value.ruleId).toBe('SV-1')
  })

  it('loads nothing when no rule is selected', async () => {
    setup()
    await flushPromises()
    expect(fetchRule).not.toHaveBeenCalled()
  })

  it('loads a newly selected rule and finds its checklist row', async () => {
    const { selectRule, ruleContent, selectedChecklistItem } = setup()
    selectRule('SV-2')
    await flushPromises()
    expect(fetchRule).toHaveBeenLastCalledWith('RHEL_9', 'V2R1', 'SV-2')
    expect(ruleContent.value.ruleId).toBe('SV-2')
    expect(selectedChecklistItem.value).toEqual({ ruleId: 'SV-2' })
  })

  it.each([
    ['revision', ({ rev }) => { rev.value = 'V2R2' }, ['RHEL_9', 'V2R2', 'SV-1']],
    ['STIG', ({ bId }) => { bId.value = 'RHEL_8' }, ['RHEL_8', 'V2R1', 'SV-1']],
  ])('reloads the same rule id for a new %s', async (_, change, expected) => {
    const ctx = setup({ ruleId: 'SV-1' })
    await flushPromises()
    fetchRule.mockClear()

    change(ctx)
    await flushPromises()
    expect(fetchRule).toHaveBeenCalledTimes(1)
    expect(fetchRule).toHaveBeenCalledWith(...expected)
    expect(ctx.ruleContent.value.title).toBe(expected.join(' '))
  })

  it('does not refetch when the checklist rows change (e.g. after a save)', async () => {
    const { ruleLookupMap } = setup({ ruleId: 'SV-1' })
    await flushPromises()
    fetchRule.mockClear()

    ruleLookupMap.value = new Map([['SV-1', { ruleId: 'SV-1', result: 'pass' }]])
    await flushPromises()
    expect(fetchRule).not.toHaveBeenCalled()
  })

  it('clears the content when the selection is cleared', async () => {
    const { clearSelectedRule, ruleContent } = setup({ ruleId: 'SV-1' })
    await flushPromises()
    clearSelectedRule()
    await flushPromises()
    expect(ruleContent.value).toBeNull()
  })
})
