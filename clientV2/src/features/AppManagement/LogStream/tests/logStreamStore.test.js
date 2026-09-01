import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createLogStreamStore } from '../stores/logStreamStore.js'

// Builds a fake stream socket that records the callbacks the store wires up, so
// a test can drive inbound frames and auth state without a real WebSocket.
function makeFakeSocket() {
  const isAuthorized = ref(false)
  const lastError = ref(null)
  const status = ref('idle')
  const sent = []
  const connect = vi.fn()
  let onMessage
  let onStatusChange
  const factory = (opts) => {
    onMessage = opts.onMessage
    onStatusChange = opts.onStatusChange
    return {
      isAuthorized,
      lastError,
      status,
      connect,
      disconnect: vi.fn(),
      send: vi.fn(),
      sendCommand: (command, extra = {}) => sent.push({ command, ...extra }),
    }
  }
  return {
    factory,
    connect,
    isAuthorized,
    lastError,
    status,
    sent,
    deliverLog: data => onMessage({ type: 'log', data }),
    setStatus: s => onStatusChange(s),
  }
}

function logFrame(overrides = {}) {
  return { level: 3, component: 'mysql', message: 'hi', ...overrides }
}

// Fake stand-in for useStateWorker: refs the test can flip to simulate the
// shared state worker reporting the API down and back up.
function makeFakeApiState() {
  const state = ref(null)
  const error = ref(null)
  return { state, error, useApiState: () => ({ state, error }) }
}

describe('logStreamStore', () => {
  let fake
  let api
  let store

  beforeEach(() => {
    fake = makeFakeSocket()
    api = makeFakeApiState()
    store = createLogStreamStore({ createSocket: fake.factory, useApiState: api.useApiState })
  })

  it('buffers inbound log frames and tracks the line count', () => {
    fake.deliverLog(logFrame())
    fake.deliverLog(logFrame())
    expect(store.state.lineCount).toBe(2)
    expect(store.snapshot()).toHaveLength(2)
  })

  it('keeps the buffer across a mount/unmount cycle (survives navigation)', () => {
    fake.deliverLog(logFrame())
    // Simulate the view mounting, then unmounting (unsubscribe), then remounting.
    const unsub = store.subscribe({ onAppend: vi.fn(), onClear: vi.fn() })
    unsub()
    // A frame arriving while no view is mounted must still be captured.
    fake.deliverLog(logFrame())
    expect(store.snapshot()).toHaveLength(2)
  })

  it('fans out live records only to current subscribers', () => {
    const onAppend = vi.fn()
    const unsub = store.subscribe({ onAppend })
    fake.deliverLog(logFrame())
    expect(onAppend).toHaveBeenCalledTimes(1)
    unsub()
    fake.deliverLog(logFrame())
    expect(onAppend).toHaveBeenCalledTimes(1) // no more after unsubscribe
  })

  it('sends stream-start immediately when already authorized', () => {
    fake.isAuthorized.value = true
    store.startStreaming({ level: [1] })
    expect(store.state.isStreaming).toBe(true)
    expect(fake.sent).toContainEqual({ command: 'stream-start', filter: { level: [1] } })
  })

  it('defers stream-start until authorized, then resumes on (re)auth', async () => {
    store.startStreaming()
    expect(fake.sent).toHaveLength(0) // not authorized yet
    fake.isAuthorized.value = true // e.g. handshake completes / reconnect
    await nextTick() // isAuthorized watch flushes
    expect(fake.sent).toContainEqual({ command: 'stream-start' })
  })

  it('reconnects a closed socket when the state worker reports the API is back', async () => {
    // Stream is on, then the connection dies terminally (retries exhausted).
    store.startStreaming()
    fake.setStatus('closed')
    api.state.value = { dependencies: { db: false, oidc: true } } // API down, mask up
    await nextTick()
    expect(fake.connect).not.toHaveBeenCalled() // down alone triggers nothing

    api.state.value = { dependencies: { db: true, oidc: true } } // recovery, mask lifts
    await nextTick()
    expect(fake.connect).toHaveBeenCalledTimes(1)
  })

  it('does not reconnect on API recovery while the socket is healthy', async () => {
    fake.setStatus('open')
    api.state.value = { dependencies: { db: false, oidc: true } }
    await nextTick()
    api.state.value = { dependencies: { db: true, oidc: true } }
    await nextTick()
    expect(fake.connect).not.toHaveBeenCalled()
  })

  it('clears the buffer and notifies subscribers', () => {
    const onClear = vi.fn()
    store.subscribe({ onClear })
    fake.deliverLog(logFrame())
    store.clear()
    expect(store.state.lineCount).toBe(0)
    expect(store.snapshot()).toEqual([])
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('drops the buffer when starting a stream with preserve off', () => {
    fake.isAuthorized.value = true
    fake.deliverLog(logFrame())
    store.setPreserveLog(false)
    store.startStreaming()
    expect(store.state.lineCount).toBe(0)
  })

  it('builds a transaction row from a rest transaction frame', () => {
    fake.deliverLog({
      date: '2026-08-26T12:00:00.000Z',
      level: 3,
      component: 'rest',
      type: 'transaction',
      data: {
        request: { requestId: 'r1', source: '::1', method: 'GET', url: '/api/x', headers: { 'user-agent': 'Chrome/1' } },
        response: { status: 200, headers: {} },
        operationStats: { durationMs: 3, operationId: 'getX' },
      },
    })
    expect(store.state.transactions).toHaveLength(1)
    expect(store.state.transactions[0]).toMatchObject({ requestId: 'r1', status: '200', operationId: 'getX' })
  })

  it('pairs separate request and response frames into one row', () => {
    fake.deliverLog({
      date: '2026-08-26T12:00:00.000Z',
      component: 'rest',
      type: 'request',
      data: { requestId: 'r2', source: '::1', method: 'POST', url: '/api/y', headers: { 'user-agent': 'Firefox/2' } },
    })
    expect(store.state.transactions).toHaveLength(0) // response not seen yet
    fake.deliverLog({
      component: 'rest',
      type: 'response',
      data: { requestId: 'r2', status: 201, headers: {}, operationStats: { durationMs: 5, operationId: 'postY' } },
    })
    expect(store.state.transactions).toHaveLength(1)
    expect(store.state.transactions[0]).toMatchObject({ requestId: 'r2', status: '201', operationId: 'postY' })
  })

  it('evicts the oldest unpaired request so orphaned requests cannot leak', () => {
    // Exceed the 1000-entry cap by one, all without responses.
    for (let i = 0; i <= 1000; i++) {
      fake.deliverLog({
        component: 'rest',
        type: 'request',
        data: { requestId: `req-${i}`, method: 'GET', url: '/api/x', headers: {} },
      })
    }
    // The first request was evicted: its late response no longer pairs into a row.
    fake.deliverLog({
      component: 'rest',
      type: 'response',
      data: { requestId: 'req-0', status: 200, headers: {}, operationStats: { durationMs: 1, operationId: 'getX' } },
    })
    expect(store.state.transactions).toHaveLength(0)
    // A still-tracked request pairs as normal.
    fake.deliverLog({
      component: 'rest',
      type: 'response',
      data: { requestId: 'req-1000', status: 200, headers: {}, operationStats: { durationMs: 1, operationId: 'getX' } },
    })
    expect(store.state.transactions).toHaveLength(1)
    expect(store.state.transactions[0]).toMatchObject({ requestId: 'req-1000' })
  })

  it('clears transactions along with the buffer', () => {
    fake.deliverLog({
      date: '2026-08-26T12:00:00.000Z',
      component: 'rest',
      type: 'transaction',
      data: {
        request: { requestId: 'r3', method: 'GET', url: '/api/z', headers: {} },
        response: { status: 200, headers: {} },
        operationStats: { durationMs: 1, operationId: 'getZ' },
      },
    })
    store.clear()
    expect(store.state.transactions).toEqual([])
  })

  it('mirrors socket status and errors into state', async () => {
    fake.setStatus('open')
    expect(store.state.status).toBe('open')
    fake.lastError.value = 'boom'
    await nextTick() // lastError watch flushes
    expect(store.state.lastError).toBe('boom')
  })
})
