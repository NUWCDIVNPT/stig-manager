import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazyResource } from '../composables/useLazyResource.js'

describe('useLazyResource', () => {
  beforeEach(() => {
    // useAsyncState routes errors to the global handler, which console.errors.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts empty and fetches on first ensure()', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }])
    const { items, ensure } = useLazyResource(fetcher)

    expect(items.value).toEqual([])
    await ensure()

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(items.value).toEqual([{ id: 1 }])
  })

  it('caches: repeat ensure() calls do not refetch', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }])
    const { ensure } = useLazyResource(fetcher)

    await ensure()
    await ensure()
    await ensure()

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('reset() drops the cache so the next ensure() refetches and clears items', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }])
    const { items, ensure, reset } = useLazyResource(fetcher)

    await ensure()
    reset()
    expect(items.value).toEqual([])

    await ensure()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not cache a failed fetch — the next ensure() retries', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([{ id: 1 }])
    const { items, ensure } = useLazyResource(fetcher)

    await ensure()
    expect(items.value).toEqual([])

    await ensure()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(items.value).toEqual([{ id: 1 }])
  })

  it('forwards arguments to the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const { ensure } = useLazyResource(fetcher)

    await ensure('abc')

    // useAsyncState appends a { signal } options arg for cancellation support.
    expect(fetcher).toHaveBeenCalledWith('abc', expect.objectContaining({ signal: expect.anything() }))
  })
})
