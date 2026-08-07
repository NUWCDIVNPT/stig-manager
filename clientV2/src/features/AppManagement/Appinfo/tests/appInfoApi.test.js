import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCall } from '../../../../shared/api/apiClient.js'
import { fetchAppInfo } from '../api/appInfoApi.js'

vi.mock('../../../../shared/api/apiClient.js', () => ({
  apiCall: vi.fn(),
}))

describe('fetchAppInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses exact row counts by default', async () => {
    apiCall.mockResolvedValue({ schema: 'stig-manager-appinfo-v1.1' })

    await fetchAppInfo()

    expect(apiCall).toHaveBeenCalledWith(
      'getAppInfo',
      { elevate: true, includeRowCounts: true },
      undefined,
      { signal: undefined },
    )
  })

  it('can request exact row counts and forward an abort signal', async () => {
    const controller = new AbortController()
    apiCall.mockResolvedValue({ schema: 'stig-manager-appinfo-v1.1' })

    await fetchAppInfo({ includeRowCounts: true, signal: controller.signal })

    expect(apiCall).toHaveBeenCalledWith(
      'getAppInfo',
      { elevate: true, includeRowCounts: true },
      undefined,
      { signal: controller.signal },
    )
  })
})
