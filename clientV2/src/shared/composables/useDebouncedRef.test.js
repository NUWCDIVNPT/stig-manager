import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, watch } from 'vue'
import { useDebouncedRef } from './useDebouncedRef.js'

describe('useDebouncedRef', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const ref = useDebouncedRef('hello')
    expect(ref.value).toBe('hello')
  })

  it('should not trigger watchers before delay', async () => {
    const ref = useDebouncedRef('initial', 300)
    const callback = vi.fn()
    watch(ref, callback)

    ref.value = 'updated'
    await nextTick()

    expect(callback).not.toHaveBeenCalled()
    expect(ref.value).toBe('initial')
  })

  it('should trigger watchers after delay elapses', async () => {
    const ref = useDebouncedRef('initial', 300)
    const callback = vi.fn()
    watch(ref, callback)

    ref.value = 'updated'
    vi.advanceTimersByTime(300)
    await nextTick()

    expect(ref.value).toBe('updated')
    expect(callback).toHaveBeenCalledWith('updated', 'initial', expect.anything())
  })

  it('should reset timer on rapid successive sets (only last value triggers)', async () => {
    const ref = useDebouncedRef('initial', 200)
    const callback = vi.fn()
    watch(ref, callback)

    ref.value = 'first'
    vi.advanceTimersByTime(100)
    ref.value = 'second'
    vi.advanceTimersByTime(100)
    ref.value = 'third'
    vi.advanceTimersByTime(200)
    await nextTick()

    expect(ref.value).toBe('third')
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('third', 'initial', expect.anything())
  })

  it('should use default delay of 200ms', async () => {
    const ref = useDebouncedRef('initial')
    const callback = vi.fn()
    watch(ref, callback)

    ref.value = 'updated'
    vi.advanceTimersByTime(199)
    await nextTick()
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(callback).toHaveBeenCalled()
  })
})
