import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupStateHandler, useStateWorker } from './useStateWorker.js'

describe('setupStateHandler', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // With STIGMAN_CLIENT_STATE_EVENTS=false, init.js never creates the state
  // worker. Boot must still succeed, and consumers see no state.
  it('does nothing when state events are disabled', () => {
    vi.stubGlobal('STIGMAN', { Env: { stateEvents: false } })
    expect(() => setupStateHandler()).not.toThrow()
    expect(useStateWorker().state.value).toBeNull()
  })

  it('applies state reports from the worker channel', () => {
    const channel = new EventTarget()
    vi.stubGlobal('STIGMAN', { Env: { stateEvents: true }, stateWorker: { workerChannel: channel } })
    setupStateHandler()
    const message = new Event('message')
    message.data = { type: 'state-report', data: JSON.stringify({ currentState: 'available' }) }
    channel.dispatchEvent(message)
    expect(useStateWorker().state.value).toEqual({ currentState: 'available' })
  })
})
