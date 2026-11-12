// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Loads the real shared worker (it lives in the legacy client tree) with the
// browser APIs it touches stubbed, one fresh instance per test.

const APP_URI = 'https://app.test/client-v2/'
const CLIENT_REAUTH_URI = 'https://app.test/reauth.html'
const CLIENT_V2_REAUTH_URI = 'https://app.test/client-v2/reauth.html'

const oidcConfiguration = {
  authorization_endpoint: 'https://op.test/auth',
  token_endpoint: 'https://op.test/token',
  end_session_endpoint: 'https://op.test/logout?ui=1',
  code_challenge_methods_supported: ['S256'],
}

const env = {
  authority: 'https://op.test',
  clientId: 'stig-manager',
  responseMode: 'query',
  scopePrefix: '',
  strictPkce: true,
  idleTimeoutUser: 10,
  idleTimeoutAdmin: 10,
  claims: { scopeList: ['scope'], username: 'preferred_username', privileges: 'realm_access.roles' },
}

function jwt(lifetimeS) {
  const encode = value => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const payload = {
    exp: Math.floor(Date.now() / 1000) + lifetimeS,
    preferred_username: 'admin',
    scope: 'stig-manager',
    realm_access: { roles: ['admin'] },
  }
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`
}

function tokenResponse(overrides = {}) {
  return {
    access_token: jwt(300),
    refresh_token: jwt(1800),
    id_token: 'id-token-1',
    ...overrides,
  }
}

function okJson(body) {
  return { ok: true, json: () => Promise.resolve(body) }
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let events
let broadcasts
let fetchMock

// A worker port as onconnect sees it: send() resolves with the raw reply.
function connect() {
  const port = {
    start() {},
    pending: new Map(),
    postMessage(message) {
      events.push(message.error ? 'reply:error' : 'reply')
      port.pending.get(message.requestId)?.(message)
    },
  }
  globalThis.onconnect({ ports: [port] })
  return {
    send(request) {
      const requestId = crypto.randomUUID()
      return new Promise((resolve) => {
        port.pending.set(requestId, resolve)
        port.onmessage({ target: port, data: { ...request, requestId } })
      })
    },
  }
}

async function loadWorker() {
  vi.resetModules()
  await import('../../../../client/src/js/workers/oidc-worker.js')
  return connect()
}

async function request(worker, message) {
  const { response, error } = await worker.send(message)
  expect(error).toBeUndefined()
  return response
}

function initialize(worker, options = {}) {
  return worker.send({
    request: 'initialize',
    redirectUri: APP_URI,
    env,
    oidcConfiguration,
    clientReauthUri: CLIENT_REAUTH_URI,
    clientV2ReauthUri: CLIENT_V2_REAUTH_URI,
    ...options,
  })
}

async function signIn(worker, tokens = tokenResponse()) {
  await initialize(worker)
  const authorization = await request(worker, { request: 'getAccessToken', redirectUri: APP_URI })
  fetchMock.mockResolvedValueOnce(okJson(tokens))
  const exchange = await request(worker, {
    request: 'exchangeCodeForToken',
    code: 'code',
    codeVerifier: authorization.codeVerifier,
    redirectUri: APP_URI,
  })
  expect(exchange.success).toBe(true)
  broadcasts.length = 0
  events.length = 0
  fetchMock.mockClear()
}

beforeEach(() => {
  events = []
  broadcasts = []
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('onconnect', null)
  vi.stubGlobal('BroadcastChannel', class {
    postMessage(message) {
      events.push(`broadcast:${message.type}`)
      broadcasts.push(message)
    }
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('oidc worker initialize', () => {
  const noPkce = { ...oidcConfiguration, code_challenge_methods_supported: [] }

  it('accepts a valid configuration', async () => {
    const worker = await loadWorker()

    const { response } = await initialize(worker)

    expect(response).toMatchObject({ success: true, env, logoutAvailable: true })
    expect((await request(worker, { request: 'getStatus' })).initialized).toBe(true)
  })

  it('keeps refusing a rejected configuration instead of passing it on the next load', async () => {
    const worker = await loadWorker()

    const first = await initialize(worker, { oidcConfiguration: noPkce })
    const second = await initialize(worker, { oidcConfiguration: noPkce })

    expect(first.response).toMatchObject({ success: false, error: expect.stringMatching(/PKCE/) })
    expect(second.response).toMatchObject({ success: false, error: expect.stringMatching(/PKCE/) })
    expect((await request(worker, { request: 'getStatus' })).initialized).toBe(false)
  })

  it('offers no sign-in or logout against a rejected configuration', async () => {
    const worker = await loadWorker()
    await initialize(worker, { oidcConfiguration: noPkce })

    const authorization = await worker.send({ request: 'getAccessToken', redirectUri: APP_URI })
    const logout = await worker.send({ request: 'logout' })

    expect(authorization.response?.redirectOidc).toBeUndefined()
    expect(authorization.error).toBeTruthy()
    expect(logout.response).toEqual({ success: false, error: 'Logout not available' })
  })

  it('recovers when a later load supplies a valid configuration', async () => {
    const worker = await loadWorker()
    await initialize(worker, { oidcConfiguration: noPkce })

    const { response } = await initialize(worker)

    expect(response.success).toBe(true)
    expect((await request(worker, { request: 'getStatus' })).initialized).toBe(true)
  })

  it('reports a failed metadata fetch on every load, not a TypeError', async () => {
    const worker = await loadWorker()
    fetchMock.mockRejectedValue(new Error('offline'))

    const first = await initialize(worker, { oidcConfiguration: undefined })
    const second = await initialize(worker, { oidcConfiguration: undefined })

    const expected = { success: false, error: 'Cannot connect to the Sign-in Service.' }
    expect(first).toMatchObject({ response: expected })
    expect(second).toMatchObject({ response: expected })
  })

  it('does not stick on a bad redirect scheme', async () => {
    const worker = await loadWorker()

    const first = await initialize(worker, { redirectUri: 'file:///index.html' })
    const second = await initialize(worker)

    expect(first.response.success).toBe(false)
    expect(second.response.success).toBe(true)
  })
})

describe('oidc worker logout', () => {
  it('reports logout as unavailable before initialization instead of throwing', async () => {
    const worker = await loadWorker()

    const reply = await worker.send({ request: 'logout' })

    expect(reply.error).toBeUndefined()
    expect(reply.response).toEqual({ success: false, error: 'Logout not available' })
  })

  it('reports logout as unavailable when the OP has no end_session_endpoint', async () => {
    const worker = await loadWorker()
    await initialize(worker, { oidcConfiguration: { ...oidcConfiguration, end_session_endpoint: undefined } })

    expect(await request(worker, { request: 'logout' })).toEqual({ success: false, error: 'Logout not available' })
  })

  it('sends id_token_hint, keeps the endpoint query and adds no post_logout_redirect_uri', async () => {
    const worker = await loadWorker()
    await signIn(worker)

    const { redirect } = await request(worker, { request: 'logout' })

    const url = new URL(redirect)
    expect(`${url.origin}${url.pathname}`).toBe('https://op.test/logout')
    expect(url.searchParams.get('ui')).toBe('1')
    expect(url.searchParams.get('id_token_hint')).toBe('id-token-1')
    expect(url.searchParams.has('client_id')).toBe(false)
    expect(url.searchParams.has('post_logout_redirect_uri')).toBe(false)
  })

  it('falls back to client_id when there is no id_token', async () => {
    const worker = await loadWorker()
    await signIn(worker, tokenResponse({ id_token: undefined }))

    const url = new URL((await request(worker, { request: 'logout' })).redirect)

    expect(url.searchParams.has('id_token_hint')).toBe(false)
    expect(url.searchParams.get('client_id')).toBe('stig-manager')
  })

  it('keeps the id_token when a refresh response omits it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const worker = await loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    fetchMock.mockResolvedValueOnce(okJson(tokenResponse({ id_token: undefined })))

    await vi.advanceTimersByTimeAsync(11_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const url = new URL((await request(worker, { request: 'logout' })).redirect)
    expect(url.searchParams.get('id_token_hint')).toBe('id-token-1')
  })

  it('uses the newer id_token when a refresh returns one', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const worker = await loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    fetchMock.mockResolvedValueOnce(okJson(tokenResponse({ id_token: 'id-token-2' })))

    await vi.advanceTimersByTimeAsync(11_000)

    const url = new URL((await request(worker, { request: 'logout' })).redirect)
    expect(url.searchParams.get('id_token_hint')).toBe('id-token-2')
  })

  it('stops handing out the token', async () => {
    const worker = await loadWorker()
    await signIn(worker)

    await request(worker, { request: 'logout' })

    const response = await request(worker, { request: 'getAccessToken', redirectUri: APP_URI })
    expect(response.accessToken).toBeUndefined()
    expect(response.redirectOidc).toMatch(/^https:\/\/op\.test\/auth\?/)
  })

  it('tells every tab before replying to the tab that navigates away', async () => {
    const worker = await loadWorker()
    await signIn(worker)

    await request(worker, { request: 'logout' })

    expect(events).toEqual(['broadcast:noToken', 'reply'])
  })

  it('gives each client a working reauth authorization in the broadcast', async () => {
    const worker = await loadWorker()
    await signIn(worker)

    await request(worker, { request: 'logout' })

    const [{ client, clientV2 }] = broadcasts
    expect(client.redirectOidc).toContain(encodeURIComponent(CLIENT_REAUTH_URI))
    expect(clientV2.redirectOidc).toContain(encodeURIComponent(CLIENT_V2_REAUTH_URI))
  })

  it('keeps the broadcast authorization so its verifier is still checked', async () => {
    const worker = await loadWorker()
    await signIn(worker)
    await request(worker, { request: 'logout' })
    fetchMock.mockClear()

    const reply = await request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: 'not-the-verifier',
      redirectUri: CLIENT_V2_REAUTH_URI,
    })

    expect(reply.success).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not reuse an authorization left pending from before the logout', async () => {
    const worker = await loadWorker()
    await initialize(worker)
    const pending = await request(worker, { request: 'getAccessToken', redirectUri: 'https://app.test/other' })
    expect(pending.state).toBeTruthy()
    await signIn(worker)
    await request(worker, { request: 'logout' })

    const fresh = await request(worker, { request: 'getAccessToken', redirectUri: 'https://app.test/other' })

    expect(fresh.state).toBeTruthy()
    expect(fresh.state).not.toBe(pending.state)
  })

  it('cancels the refresh, access and idle timers', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const worker = await loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))

    await request(worker, { request: 'logout' })
    events.length = 0
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(events).toEqual([])
  })

  it('does not let a refresh in flight restore the tokens', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const worker = await loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    const refresh = deferred()
    fetchMock.mockReturnValueOnce(refresh.promise)
    await vi.advanceTimersByTimeAsync(11_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await request(worker, { request: 'logout' })
    events.length = 0
    refresh.resolve(okJson(tokenResponse()))
    await vi.advanceTimersByTimeAsync(0)

    expect(events).toEqual([])
    const response = await request(worker, { request: 'getAccessToken', redirectUri: APP_URI })
    expect(response.accessToken).toBeUndefined()
  })

  it('does not let a failed refresh in flight act on the new session', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const worker = await loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    const refresh = deferred()
    fetchMock.mockReturnValueOnce(refresh.promise)
    await vi.advanceTimersByTimeAsync(11_000)

    await request(worker, { request: 'logout' })
    events.length = 0
    refresh.reject(new Error('network down'))
    await vi.advanceTimersByTimeAsync(0)

    expect(events).toEqual([])
  })

  it('reports a sign-in that logout overtook as failed', async () => {
    const worker = await loadWorker()
    await initialize(worker)
    const authorization = await request(worker, { request: 'getAccessToken', redirectUri: APP_URI })
    const exchangeResponse = deferred()
    fetchMock.mockReturnValueOnce(exchangeResponse.promise)
    const pending = request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: authorization.codeVerifier,
      redirectUri: APP_URI,
    })

    await request(worker, { request: 'logout' })
    exchangeResponse.resolve(okJson(tokenResponse()))

    const exchange = await pending
    expect(exchange.success).toBe(false)
    expect(exchange.error).toBeTruthy()
  })

  it('does not carry an id_token into a new sign-in', async () => {
    const worker = await loadWorker()
    await signIn(worker)
    fetchMock.mockResolvedValueOnce(okJson(tokenResponse({ id_token: undefined })))
    await request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: 'verifier',
      redirectUri: 'https://app.test/second-user',
    })

    const url = new URL((await request(worker, { request: 'logout' })).redirect)

    expect(url.searchParams.has('id_token_hint')).toBe(false)
  })

  it('allows signing in again afterwards', async () => {
    const worker = await loadWorker()
    await signIn(worker)
    await request(worker, { request: 'logout' })

    const authorization = await request(worker, { request: 'getAccessToken', redirectUri: APP_URI })
    fetchMock.mockResolvedValueOnce(okJson(tokenResponse({ id_token: 'id-token-2' })))
    const exchange = await request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: authorization.codeVerifier,
      redirectUri: APP_URI,
    })

    expect(exchange.success).toBe(true)
    const token = await request(worker, { request: 'getAccessToken', redirectUri: APP_URI })
    expect(token.accessToken).toBeTruthy()
  })
})
