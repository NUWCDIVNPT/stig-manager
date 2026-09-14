import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRuleSelection } from '../composables/useRuleSelection.js'

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchRule: vi.fn(),
}))

const { fetchRule } = await import('../../../shared/api/stigsApi.js')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function setup({ ruleId = 'SV-1r1_rule' } = {}) {
  const refs = {
    benchmarkId: ref('RHEL_8'),
    viewRev: ref('V1R1'),
    selectedRuleId: ref(ruleId),
  }
  return { ...refs, ...useRuleSelection(refs) }
}

describe('useRuleSelection', () => {
  it('fetches the selected rule against the current benchmark and revision', async () => {
    fetchRule.mockClear()
    fetchRule.mockResolvedValue({ ruleId: 'SV-1r1_rule' })
    const { ruleContent } = setup()
    await flushPromises()

    expect(fetchRule).toHaveBeenCalledWith('RHEL_8', 'V1R1', 'SV-1r1_rule')
    expect(ruleContent.value).toEqual({ ruleId: 'SV-1r1_rule' })
  })

  it('does not fetch until a rule is selected', async () => {
    fetchRule.mockClear()
    const { selectedRuleId, ruleContent } = setup({ ruleId: null })
    await flushPromises()
    expect(fetchRule).not.toHaveBeenCalled()
    expect(ruleContent.value).toBeNull()

    fetchRule.mockResolvedValue({ ruleId: 'SV-2r1_rule' })
    selectedRuleId.value = 'SV-2r1_rule'
    await nextTick()
    await flushPromises()
    expect(fetchRule).toHaveBeenCalledWith('RHEL_8', 'V1R1', 'SV-2r1_rule')
  })

  it('refetches when the revision changes under a stable selection', async () => {
    fetchRule.mockClear()
    fetchRule.mockResolvedValue({ ruleId: 'SV-1r1_rule' })
    const { viewRev } = setup()
    await flushPromises()

    viewRev.value = 'V1R2'
    await nextTick()
    await flushPromises()
    expect(fetchRule).toHaveBeenLastCalledWith('RHEL_8', 'V1R2', 'SV-1r1_rule')
  })

  it('clears the previous rule when the selection is cleared', async () => {
    fetchRule.mockResolvedValue({ ruleId: 'SV-1r1_rule' })
    const { selectedRuleId, ruleContent } = setup()
    await flushPromises()
    expect(ruleContent.value).not.toBeNull()

    selectedRuleId.value = null
    await nextTick()
    expect(ruleContent.value).toBeNull()
  })

  it('surfaces a fetch failure without throwing', async () => {
    const err = new Error('boom')
    fetchRule.mockRejectedValue(err)
    const { ruleContentError, isRuleLoading } = setup()
    await flushPromises()

    expect(ruleContentError.value).toBe(err)
    expect(isRuleLoading.value).toBe(false)
  })

  it('retry() refetches the current selection, and is a no-op without one', async () => {
    fetchRule.mockClear()
    fetchRule.mockResolvedValue({ ruleId: 'SV-1r1_rule' })
    const { selectedRuleId, retry } = setup()
    await flushPromises()
    expect(fetchRule).toHaveBeenCalledTimes(1)

    retry()
    await flushPromises()
    expect(fetchRule).toHaveBeenCalledTimes(2)

    selectedRuleId.value = null
    await nextTick()
    retry()
    await flushPromises()
    expect(fetchRule).toHaveBeenCalledTimes(2)
  })
})
