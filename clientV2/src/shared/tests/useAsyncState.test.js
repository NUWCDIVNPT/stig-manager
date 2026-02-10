import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAsyncState } from '../composables/useAsyncState.js'
import { useGlobalError } from '../composables/useGlobalError.js'

// Mock useGlobalError
vi.mock('../composables/useGlobalError.js', () => {
  const triggerError = vi.fn()
  return {
    useGlobalError: () => ({
      triggerError,
    }),
  }
})

describe('useAsyncState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should execute successfully and update state', async () => {
    const promiseFactory = vi.fn().mockResolvedValue('success data')
    const { state, isLoading, error, execute } = useAsyncState(promiseFactory, { immediate: false })

    expect(state.value).toBe(null)
    expect(isLoading.value).toBe(false)

    const promise = execute()
    expect(isLoading.value).toBe(true)

    await promise

    expect(state.value).toBe('success data')
    expect(isLoading.value).toBe(false)
    expect(error.value).toBe(null)
  })

  it('should trigger global error by default on failure', async () => {
    const testError = new Error('Test logic failure')
    const promiseFactory = vi.fn().mockRejectedValue(testError)
    const { triggerError } = useGlobalError()

    const { execute, error } = useAsyncState(promiseFactory, { immediate: false })

    await execute()

    expect(error.value).toBe(testError)
    expect(triggerError).toHaveBeenCalledWith(testError)
  })

  it('should opt-out of global error if onError is null', async () => {
    const testError = new Error('Ignored failure')
    const promiseFactory = vi.fn().mockRejectedValue(testError)
    const { triggerError } = useGlobalError()

    const { execute } = useAsyncState(promiseFactory, {
      immediate: false,
      onError: null,
    })

    await execute()

    expect(triggerError).not.toHaveBeenCalled()
  })

  it('should use custom onError handler if provided', async () => {
    const testError = new Error('Custom handled failure')
    const promiseFactory = vi.fn().mockRejectedValue(testError)
    const { triggerError } = useGlobalError()
    const customHandler = vi.fn()

    const { execute } = useAsyncState(promiseFactory, {
      immediate: false,
      onError: customHandler,
    })

    await execute()

    expect(customHandler).toHaveBeenCalledWith(testError)
    expect(triggerError).not.toHaveBeenCalled()
  })

  it('should execute immediately if immediate is true', async () => {
    const promiseFactory = vi.fn().mockResolvedValue('immediate data')
    const { state } = useAsyncState(promiseFactory, { immediate: true })

    // waiting for promise execution
    await flushPromises()

    expect(promiseFactory).toHaveBeenCalled()
    expect(state.value).toBe('immediate data')
  })
})
