import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { fetchStigRevisions } from '../api/stigsApi.js'
import { useGlobalError } from './useGlobalError.js'
import { useStigRevisions } from './useStigRevisions.js'

vi.mock('../api/stigsApi.js', () => ({
  fetchStigRevisions: vi.fn(),
}))

const RHEL_REVS = [{ revisionStr: 'V1R2' }, { revisionStr: 'V1R1' }]

function setup(benchmarkId = 'RHEL_8', revisionStr = 'V1R2') {
  const bId = ref(benchmarkId)
  const rev = ref(revisionStr)
  const onUnknown = vi.fn()
  const result = useStigRevisions({ benchmarkId: bId, revisionStr: rev, onUnknown })
  return { bId, rev, onUnknown, ...result }
}

describe('useStigRevisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchStigRevisions.mockImplementation(async id => (id === 'RHEL_8' ? RHEL_REVS : []))
  })

  it('loads the STIG revisions and accepts a known revision', async () => {
    const { revisions, onUnknown } = setup()
    await flushPromises()
    expect(fetchStigRevisions).toHaveBeenCalledWith('RHEL_8')
    expect(revisions.value).toEqual(RHEL_REVS)
    expect(onUnknown).not.toHaveBeenCalled()
  })

  it('flags a STIG that does not exist', async () => {
    const { onUnknown } = setup('NOT_A_STIG', 'V1R1')
    await flushPromises()
    expect(onUnknown).toHaveBeenCalledOnce()
  })

  it('flags a revision the STIG does not have', async () => {
    const { onUnknown } = setup('RHEL_8', 'V9R9')
    await flushPromises()
    expect(onUnknown).toHaveBeenCalledOnce()
  })

  it('flags a malformed revision', async () => {
    const { onUnknown } = setup('RHEL_8', 'banana')
    await flushPromises()
    expect(onUnknown).toHaveBeenCalledOnce()
  })

  it('accepts latest', async () => {
    const { onUnknown } = setup('RHEL_8', 'latest')
    await flushPromises()
    expect(onUnknown).not.toHaveBeenCalled()
  })

  it('flags a STIG that does not exist even with revision latest', async () => {
    const { onUnknown } = setup('NOT_A_STIG', 'latest')
    await flushPromises()
    expect(onUnknown).toHaveBeenCalledOnce()
  })

  it('checks a revision change against the already loaded list', async () => {
    const { rev, onUnknown } = setup()
    await flushPromises()
    rev.value = 'V1R1'
    await flushPromises()
    expect(onUnknown).not.toHaveBeenCalled()
    rev.value = 'V7R7'
    await flushPromises()
    expect(onUnknown).toHaveBeenCalledOnce()
    expect(fetchStigRevisions).toHaveBeenCalledOnce()
  })

  it('refetches on a STIG change and judges against the new STIG only', async () => {
    fetchStigRevisions.mockImplementation(async id => (id === 'RHEL_8' ? RHEL_REVS : [{ revisionStr: 'V3R1' }]))
    const { bId, rev, revisions, onUnknown } = setup()
    await flushPromises()
    bId.value = 'WIN_10'
    rev.value = 'V3R1'
    await flushPromises()
    expect(revisions.value).toEqual([{ revisionStr: 'V3R1' }])
    expect(onUnknown).not.toHaveBeenCalled()
  })

  it('does not flag anything when the revisions fetch fails', async () => {
    fetchStigRevisions.mockRejectedValue(new Error('Server Error'))
    const { onUnknown } = setup()
    await flushPromises()
    expect(onUnknown).not.toHaveBeenCalled()
  })

  it('leaves a failed fetch to the breadcrumb picker instead of opening its own error modal', async () => {
    const { error, clearError } = useGlobalError()
    clearError()
    fetchStigRevisions.mockRejectedValue(new Error('Server Error'))
    setup()
    await flushPromises()
    expect(error.value).toBeNull()
  })
})
