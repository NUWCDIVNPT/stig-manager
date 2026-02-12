import { describe, expect, it, vi } from 'vitest'
import { useAsyncState } from './useAsyncState.js'

describe('useAsyncState', () => {
  it('should handle race conditions by ignoring stale results', async () => {
    // Mock a promise factory that takes a variable amount of time
    // We want the FIRST call to take LONGER than the SECOND call
    const factory = vi.fn()
    
    let resolveFirst
    const firstPromise = new Promise(resolve => {
      resolveFirst = resolve
    })

    let resolveSecond
    const secondPromise = new Promise(resolve => {
      resolveSecond = resolve
    })

    // First call returns the slow promise
    factory.mockReturnValueOnce(firstPromise)
    // Second call returns the fast promise
    factory.mockReturnValueOnce(secondPromise)

    const { state, execute } = useAsyncState(factory, { immediate: false })

    // 1. Start the first request (Slow)
    const p1 = execute('first')
    
    // 2. Start the second request (Fast) immediately after
    const p2 = execute('second')

    // 3. Resolve the SECOND request first
    resolveSecond('Result from Second (Fast)')
    await p2

    // Expect state to be the second result
    expect(state.value).toBe('Result from Second (Fast)')

    // 4. Now resolve the FIRST request (Slow)
    resolveFirst('Result from First (Slow)')
    await p1

    // Expect state to STILL be the second result (the first result should be ignored)
    expect(state.value).toBe('Result from Second (Fast)')
  })

  it('should abort corresponding signal when a new request starts', async () => {
    const factory = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    const { execute } = useAsyncState(factory, { immediate: false })

    // 1. Start first request
    execute()
    const firstCallArgs = factory.mock.calls[0]
    const firstSignal = firstCallArgs[0].signal // We pass config as last arg, but here args are ...args, so it depends on how we call execute. 
    // Wait, useAsyncState passes (...args, { signal })
    // So if we call execute(), args is empty. factory called with ({ signal })
    
    const firstConfig = factory.mock.calls[0][0] // factory( { signal } )
    
    expect(firstConfig.signal.aborted).toBe(false)

    // 2. Start second request
    execute()

    // The first signal should now be aborted
    expect(firstConfig.signal.aborted).toBe(true)
  })
})
