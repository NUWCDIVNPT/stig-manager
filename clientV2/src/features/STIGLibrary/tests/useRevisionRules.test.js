import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRevisionRules } from '../composables/useRevisionRules.js'

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchRulesByRevision: vi.fn(),
}))

const { fetchRulesByRevision } = await import('../../../shared/api/stigsApi.js')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function rule(ruleId) {
  return { ruleId, version: ruleId }
}

describe('useRevisionRules', () => {
  it('fetches once per (benchmarkId, revision) and serves repeats from cache', async () => {
    fetchRulesByRevision.mockClear()
    fetchRulesByRevision.mockResolvedValue([rule('SV-1')])
    const { getRulesForRev } = useRevisionRules()

    await getRulesForRev('RHEL_8', 'V1R1')
    await getRulesForRev('RHEL_8', 'V1R1')
    await getRulesForRev('RHEL_8', 'V1R2')

    expect(fetchRulesByRevision).toHaveBeenCalledTimes(2)
  })

  it('dedupes concurrent requests for the same key into one fetch', async () => {
    fetchRulesByRevision.mockClear()
    fetchRulesByRevision.mockResolvedValue([rule('SV-1')])
    const { getRulesForRev } = useRevisionRules()

    const [a, b] = await Promise.all([
      getRulesForRev('RHEL_8', 'V1R1'),
      getRulesForRev('RHEL_8', 'V1R1'),
    ])

    expect(fetchRulesByRevision).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
  })

  it('does not cache a rejection, so a later call refetches', async () => {
    fetchRulesByRevision.mockClear()
    fetchRulesByRevision.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([rule('SV-1')])
    const { getRulesForRev } = useRevisionRules()

    await expect(getRulesForRev('RHEL_8', 'V1R1')).rejects.toThrow('boom')
    await expect(getRulesForRev('RHEL_8', 'V1R1')).resolves.toEqual([rule('SV-1')])
    expect(fetchRulesByRevision).toHaveBeenCalledTimes(2)
  })

  it('returns an empty array without fetching when either key part is missing', async () => {
    fetchRulesByRevision.mockClear()
    const { getRulesForRev } = useRevisionRules()

    expect(await getRulesForRev(null, 'V1R1')).toEqual([])
    expect(await getRulesForRev('RHEL_8', null)).toEqual([])
    expect(fetchRulesByRevision).not.toHaveBeenCalled()
  })

  it('invalidate(benchmarkId) drops every revision of that benchmark only', async () => {
    fetchRulesByRevision.mockClear()
    fetchRulesByRevision.mockResolvedValue([rule('SV-1')])
    const { getRulesForRev, invalidate } = useRevisionRules()

    await getRulesForRev('RHEL_8', 'V1R1')
    await getRulesForRev('RHEL_8', 'V1R2')
    await getRulesForRev('WIN_10', 'V1R1')
    expect(fetchRulesByRevision).toHaveBeenCalledTimes(3)

    invalidate('RHEL_8')
    await getRulesForRev('RHEL_8', 'V1R1')
    await getRulesForRev('RHEL_8', 'V1R2')
    await getRulesForRev('WIN_10', 'V1R1')

    expect(fetchRulesByRevision).toHaveBeenCalledTimes(5)
  })

  it('watchCurrent tracks the refs and exposes loading/ready state', async () => {
    fetchRulesByRevision.mockClear()
    fetchRulesByRevision.mockResolvedValue([rule('SV-1')])
    const bm = ref('RHEL_8')
    const rev = ref('V1R1')
    const { watchCurrent } = useRevisionRules()
    const state = watchCurrent(bm, rev)

    expect(state.isLoading).toBe(true)
    await flushPromises()
    expect(state.isLoading).toBe(false)
    expect(state.rules).toEqual([rule('SV-1')])

    fetchRulesByRevision.mockResolvedValue([rule('SV-2')])
    rev.value = 'V1R2'
    await nextTick()
    await flushPromises()
    expect(state.rules).toEqual([rule('SV-2')])
  })

  it('watchCurrent clears rules when the benchmark ref goes null', async () => {
    fetchRulesByRevision.mockResolvedValue([rule('SV-1')])
    const bm = ref('RHEL_8')
    const rev = ref('V1R1')
    const state = useRevisionRules().watchCurrent(bm, rev)
    await flushPromises()
    expect(state.rules).toHaveLength(1)

    bm.value = null
    await nextTick()
    await flushPromises()
    expect(state.rules).toEqual([])
    expect(state.isLoading).toBe(false)
  })

  it('watchCurrent ignores a stale in-flight result when the key changes mid-flight', async () => {
    let resolveSlow
    const slow = new Promise((resolve) => {
      resolveSlow = resolve
    })
    fetchRulesByRevision.mockReturnValueOnce(slow).mockResolvedValueOnce([rule('FAST')])

    const bm = ref('RHEL_8')
    const rev = ref('V1R1')
    const state = useRevisionRules().watchCurrent(bm, rev)

    rev.value = 'V1R2'
    await nextTick()
    await flushPromises()
    expect(state.rules).toEqual([rule('FAST')])

    resolveSlow([rule('SLOW')])
    await flushPromises()
    expect(state.rules).toEqual([rule('FAST')])
  })

  it('retry() invalidates the current key and refetches', async () => {
    fetchRulesByRevision.mockClear()
    fetchRulesByRevision.mockResolvedValue([rule('SV-1')])
    const state = useRevisionRules().watchCurrent(ref('RHEL_8'), ref('V1R1'))
    await flushPromises()
    expect(fetchRulesByRevision).toHaveBeenCalledTimes(1)

    await state.retry()
    expect(fetchRulesByRevision).toHaveBeenCalledTimes(2)
  })

  it('watchCurrent surfaces the error and empties rules on failure', async () => {
    const err = new Error('boom')
    fetchRulesByRevision.mockRejectedValue(err)
    const state = useRevisionRules().watchCurrent(ref('RHEL_8'), ref('V1R1'))
    await flushPromises()
    expect(state.error).toBe(err)
    expect(state.rules).toEqual([])
    expect(state.isLoading).toBe(false)
  })
})
