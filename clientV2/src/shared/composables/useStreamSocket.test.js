import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deriveSocketUrl, useStreamSocket } from './useStreamSocket.js'

vi.mock('../stores/useEnv.js', () => ({
  useEnv: () => ({ apiUrl: 'http://localhost:54000/api' }),
}))

describe('deriveSocketUrl', () => {
  it('swaps the /api mount for the socket path and http->ws', () => {
    expect(deriveSocketUrl('http://localhost:54000/api', 'socket/log-socket'))
      .toBe('ws://localhost:54000/socket/log-socket')
  })

  it('uses wss for https origins', () => {
    expect(deriveSocketUrl('https://stigman.example.mil/api', 'socket/log-socket'))
      .toBe('wss://stigman.example.mil/socket/log-socket')
  })

  it('preserves a reverse-proxy path prefix', () => {
    expect(deriveSocketUrl('https://host.mil/stigman/api', 'socket/log-socket'))
      .toBe('wss://host.mil/stigman/socket/log-socket')
  })

  it('tolerates a trailing slash on the api base and a leading slash on the path', () => {
    expect(deriveSocketUrl('https://host.mil/api/', '/socket/log-socket'))
      .toBe('wss://host.mil/socket/log-socket')
  })
})

// Minimal WebSocket double: records instances/sends/closes and lets a test
// drive open/message/close events by hand.
class FakeWebSocket {
  static instances = []
  static OPEN = 1

  constructor(url) {
    this.url = url
    this.readyState = 0
    this.listeners = {}
    this.sent = []
    this.closeCalls = []
    FakeWebSocket.instances.push(this)
  }

  addEventListener(type, cb) {
    (this.listeners[type] ||= []).push(cb)
  }

  removeEventListener(type, cb) {
    this.listeners[type] = (this.listeners[type] || []).filter(fn => fn !== cb)
  }

  send(data) {
    this.sent.push(data)
  }

  close(code, reason) {
    this.closeCalls.push({ code, reason })
    this.readyState = 3
    this.emit('close', { code: code ?? 1000, reason })
  }

  emit(type, event = {}) {
    for (const cb of this.listeners[type] || []) {
      cb(event)
    }
  }

  fireOpen() {
    this.readyState = FakeWebSocket.OPEN
    this.emit('open', {})
  }

  fireServer(obj) {
    this.emit('message', { data: JSON.stringify(obj) })
  }
}

function makeSocket(overrides = {}) {
  return useStreamSocket({
    path: 'socket/log-socket',
    getToken: () => 'tok',
    channelName: '', // skip BroadcastChannel
    ...overrides,
  })
}

describe('useStreamSocket connection handling', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('treats a never-opened socket as a connect failure: actionable error, no retry', () => {
    const socket = makeSocket({ connectErrorMessage: 'PROXY_HELP' })
    socket.connect()
    const ws = FakeWebSocket.instances[0]
    // Error then abnormal close, without ever firing `open`.
    ws.emit('error', {})
    ws.close(1006)

    expect(socket.status.value).toBe('closed')
    expect(socket.lastError.value).toBe('PROXY_HELP')
    // No reconnect scheduled → advancing time creates no second socket.
    vi.advanceTimersByTime(60000)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('reconnects when a previously-open socket drops', () => {
    const socket = makeSocket()
    socket.connect()
    const ws = FakeWebSocket.instances[0]
    ws.fireOpen()
    ws.close(1006) // abnormal drop after being open

    expect(socket.status.value).toBe('reconnecting')
    vi.advanceTimersByTime(1000) // first backoff
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('times out and closes if the server never answers the authorize handshake', () => {
    const socket = makeSocket({ authTimeoutMs: 10000 })
    socket.connect()
    const ws = FakeWebSocket.instances[0]
    ws.fireOpen()
    // Server prompts for auth; the client replies with a token and arms the timer.
    ws.fireServer({ type: 'authorize', data: { state: 'unauthorized' } })
    expect(ws.sent).toHaveLength(1)

    vi.advanceTimersByTime(10000)
    expect(ws.closeCalls[0]?.code).toBe(4008)
    expect(socket.lastError.value).toBe('Authorization timed out')
  })

  it('does not time out once the server authorizes', () => {
    const socket = makeSocket({ authTimeoutMs: 10000 })
    socket.connect()
    const ws = FakeWebSocket.instances[0]
    ws.fireOpen()
    ws.fireServer({ type: 'authorize', data: { state: 'unauthorized' } })
    ws.fireServer({ type: 'authorize', data: { state: 'authorized' } })
    expect(socket.isAuthorized.value).toBe(true)

    vi.advanceTimersByTime(20000)
    expect(ws.closeCalls).toHaveLength(0)
    expect(socket.status.value).toBe('open')
  })
})
