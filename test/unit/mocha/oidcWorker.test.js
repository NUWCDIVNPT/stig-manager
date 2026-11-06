import { readFile } from 'node:fs/promises'
import { mock } from 'node:test'
import { fileURLToPath } from 'node:url'
import { expect } from 'chai'

// Loads the real shared OIDC worker with the browser APIs it touches stubbed,
// one fresh instance per test.

const workerPath = fileURLToPath(new URL('../../../client/src/js/workers/oidc-worker.js', import.meta.url))
const workerSource = await readFile(workerPath, 'utf8')

const APP_URI = 'https://app.test/'
const REAUTH_URI = 'https://app.test/reauth.html'

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

const quietConsole = { log() {}, warn() {}, error() {} }

let events
let broadcasts
let fetchCalls
let fetchReplies
let saved

function queueFetch(reply) {
  fetchReplies.push(reply)
}

// Runs due timers one second at a time, letting async work settle in between.
async function advance(ms) {
  for (let elapsed = 0; elapsed < ms; elapsed += 1000) {
    mock.timers.tick(1000)
    await settle()
  }
  await settle()
}

function settle() {
  return new Promise(resolve => setImmediate(resolve))
}

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

function loadWorker() {
  new Function('console', workerSource)(quietConsole)
  return connect()
}

async function request(worker, message) {
  const { response, error } = await worker.send(message)
  expect(error).to.equal(undefined)
  return response
}

function initialize(worker, options = {}) {
  return worker.send({
    request: 'initialize',
    redirectUri: APP_URI,
    env,
    oidcConfiguration,
    ...options,
  })
}

async function signIn(worker, tokens = tokenResponse()) {
  await initialize(worker)
  const authorization = await request(worker, { request: 'getAccessToken' })
  queueFetch(okJson(tokens))
  const exchange = await request(worker, {
    request: 'exchangeCodeForToken',
    code: 'code',
    codeVerifier: authorization.codeVerifier,
    redirectUri: APP_URI,
  })
  expect(exchange.success).to.equal(true)
  broadcasts.length = 0
  events.length = 0
  fetchCalls.length = 0
}

beforeEach(() => {
  events = []
  broadcasts = []
  fetchCalls = []
  fetchReplies = []
  saved = { fetch: globalThis.fetch, BroadcastChannel: globalThis.BroadcastChannel }
  globalThis.fetch = (...args) => {
    fetchCalls.push(args)
    return fetchReplies.length ? fetchReplies.shift() : Promise.reject(new Error('offline'))
  }
  globalThis.BroadcastChannel = class {
    postMessage(message) {
      events.push(`broadcast:${message.type}`)
      broadcasts.push(message)
    }
  }
})

afterEach(() => {
  mock.timers.reset()
  Object.assign(globalThis, saved)
  delete globalThis.onconnect
})

describe('oidc worker initialize', () => {
  const noPkce = { ...oidcConfiguration, code_challenge_methods_supported: [] }

  it('accepts a valid configuration', async () => {
    const worker = loadWorker()

    const { response } = await initialize(worker)

    expect(response).to.deep.include({ success: true, env })
    expect((await request(worker, { request: 'getStatus' })).initialized).to.equal(true)
  })

  it('keeps refusing a rejected configuration instead of passing it on the next load', async () => {
    const worker = loadWorker()

    const first = await initialize(worker, { oidcConfiguration: noPkce })
    const second = await initialize(worker, { oidcConfiguration: noPkce })

    expect(first.response.success).to.equal(false)
    expect(first.response.error).to.match(/PKCE/)
    expect(second.response.success).to.equal(false)
    expect(second.response.error).to.match(/PKCE/)
    expect((await request(worker, { request: 'getStatus' })).initialized).to.equal(false)
  })

  it('offers no sign-in or logout against a rejected configuration', async () => {
    const worker = loadWorker()
    await initialize(worker, { oidcConfiguration: noPkce })

    const authorization = await worker.send({ request: 'getAccessToken' })
    const logout = await worker.send({ request: 'logout' })

    expect(authorization.response?.redirect).to.equal(undefined)
    expect(authorization.error).to.be.a('string')
    expect(logout.response).to.deep.equal({ success: false, error: 'Logout not available' })
  })

  it('recovers when a later load supplies a valid configuration', async () => {
    const worker = loadWorker()
    await initialize(worker, { oidcConfiguration: noPkce })

    const { response } = await initialize(worker)

    expect(response.success).to.equal(true)
    expect((await request(worker, { request: 'getStatus' })).initialized).to.equal(true)
  })

  it('reports a failed metadata fetch on every load, not a TypeError', async () => {
    const worker = loadWorker()

    const first = await initialize(worker, { oidcConfiguration: undefined })
    const second = await initialize(worker, { oidcConfiguration: undefined })

    const expected = { success: false, error: 'Cannot connect to the Sign-in Service.' }
    expect(first.response).to.deep.equal(expected)
    expect(second.response).to.deep.equal(expected)
  })

  it('does not stick on a bad redirect scheme', async () => {
    const worker = loadWorker()

    const first = await initialize(worker, { redirectUri: 'file:///index.html' })
    const second = await initialize(worker)

    expect(first.response.success).to.equal(false)
    expect(second.response.success).to.equal(true)
  })
})

describe('oidc worker logout', () => {
  it('reports logout as unavailable before initialization instead of throwing', async () => {
    const worker = loadWorker()

    const reply = await worker.send({ request: 'logout' })

    expect(reply.error).to.equal(undefined)
    expect(reply.response).to.deep.equal({ success: false, error: 'Logout not available' })
  })

  it('reports logout as unavailable when the OP has no end_session_endpoint', async () => {
    const worker = loadWorker()
    await initialize(worker, { oidcConfiguration: { ...oidcConfiguration, end_session_endpoint: undefined } })

    expect(await request(worker, { request: 'logout' })).to.deep.equal({ success: false, error: 'Logout not available' })
  })

  it('sends id_token_hint, keeps the endpoint query and adds no post_logout_redirect_uri', async () => {
    const worker = loadWorker()
    await signIn(worker)

    const { redirect } = await request(worker, { request: 'logout' })

    const url = new URL(redirect)
    expect(`${url.origin}${url.pathname}`).to.equal('https://op.test/logout')
    expect(url.searchParams.get('ui')).to.equal('1')
    expect(url.searchParams.get('id_token_hint')).to.equal('id-token-1')
    expect(url.searchParams.has('client_id')).to.equal(false)
    expect(url.searchParams.has('post_logout_redirect_uri')).to.equal(false)
  })

  it('falls back to client_id when there is no id_token', async () => {
    const worker = loadWorker()
    await signIn(worker, tokenResponse({ id_token: undefined }))

    const url = new URL((await request(worker, { request: 'logout' })).redirect)

    expect(url.searchParams.has('id_token_hint')).to.equal(false)
    expect(url.searchParams.get('client_id')).to.equal('stig-manager')
  })

  it('keeps the id_token when a refresh response omits it', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() })
    const worker = loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    queueFetch(okJson(tokenResponse({ id_token: undefined })))

    await advance(11_000)
    expect(fetchCalls).to.have.length(1)

    const url = new URL((await request(worker, { request: 'logout' })).redirect)
    expect(url.searchParams.get('id_token_hint')).to.equal('id-token-1')
  })

  it('uses the newer id_token when a refresh returns one', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() })
    const worker = loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    queueFetch(okJson(tokenResponse({ id_token: 'id-token-2' })))

    await advance(11_000)

    const url = new URL((await request(worker, { request: 'logout' })).redirect)
    expect(url.searchParams.get('id_token_hint')).to.equal('id-token-2')
  })

  it('stops handing out the token', async () => {
    const worker = loadWorker()
    await signIn(worker)

    await request(worker, { request: 'logout' })

    const response = await request(worker, { request: 'getAccessToken' })
    expect(response.accessToken).to.equal(undefined)
    expect(response.redirect).to.match(/^https:\/\/op\.test\/auth\?/)
  })

  it('tells every tab before replying to the tab that navigates away', async () => {
    const worker = loadWorker()
    await signIn(worker)

    await request(worker, { request: 'logout' })

    expect(events).to.deep.equal(['broadcast:noToken', 'reply'])
  })

  it('gives the client a working reauth authorization in the broadcast', async () => {
    const worker = loadWorker()
    await signIn(worker)

    await request(worker, { request: 'logout' })

    const [broadcast] = broadcasts
    expect(broadcast.redirect).to.include(encodeURIComponent(REAUTH_URI))
    expect(broadcast.codeVerifier).to.be.a('string')
  })

  it('keeps the broadcast authorization so its verifier is still checked', async () => {
    const worker = loadWorker()
    await signIn(worker)
    await request(worker, { request: 'logout' })
    fetchCalls.length = 0

    const reply = await request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: 'not-the-verifier',
      redirectUri: REAUTH_URI,
    })

    expect(reply.success).to.equal(false)
    expect(fetchCalls).to.deep.equal([])
  })

  it('does not reuse an authorization left pending from before the logout', async () => {
    const worker = loadWorker()
    await initialize(worker)
    const pending = await request(worker, { request: 'getAccessToken', redirectUri: 'https://app.test/other' })
    expect(pending.state).to.be.ok
    await signIn(worker)
    await request(worker, { request: 'logout' })

    const fresh = await request(worker, { request: 'getAccessToken', redirectUri: 'https://app.test/other' })

    expect(fresh.state).to.be.ok
    expect(fresh.state).to.not.equal(pending.state)
  })

  it('cancels the refresh, access and idle timers', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() })
    const worker = loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))

    await request(worker, { request: 'logout' })
    events.length = 0
    await advance(60 * 60 * 1000)

    expect(fetchCalls).to.deep.equal([])
    expect(events).to.deep.equal([])
  })

  it('does not let a refresh in flight restore the tokens', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() })
    const worker = loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    const refresh = deferred()
    queueFetch(refresh.promise)
    await advance(11_000)
    expect(fetchCalls).to.have.length(1)

    await request(worker, { request: 'logout' })
    events.length = 0
    refresh.resolve(okJson(tokenResponse()))
    await settle()

    expect(events).to.deep.equal([])
    const response = await request(worker, { request: 'getAccessToken' })
    expect(response.accessToken).to.equal(undefined)
  })

  it('does not let a failed refresh in flight act on the new session', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() })
    const worker = loadWorker()
    await signIn(worker, tokenResponse({ access_token: jwt(20) }))
    const refresh = deferred()
    queueFetch(refresh.promise)
    await advance(11_000)

    await request(worker, { request: 'logout' })
    events.length = 0
    refresh.reject(new Error('network down'))
    await settle()

    expect(events).to.deep.equal([])
  })

  it('reports a sign-in that logout overtook as failed', async () => {
    const worker = loadWorker()
    await initialize(worker)
    const authorization = await request(worker, { request: 'getAccessToken' })
    const exchangeResponse = deferred()
    queueFetch(exchangeResponse.promise)
    const pending = request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: authorization.codeVerifier,
      redirectUri: APP_URI,
    })

    await request(worker, { request: 'logout' })
    exchangeResponse.resolve(okJson(tokenResponse()))

    const exchange = await pending
    expect(exchange.success).to.equal(false)
    expect(exchange.error).to.be.ok
  })

  it('does not carry an id_token into a new sign-in', async () => {
    const worker = loadWorker()
    await signIn(worker)
    queueFetch(okJson(tokenResponse({ id_token: undefined })))
    await request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: 'verifier',
      redirectUri: 'https://app.test/second-user',
    })

    const url = new URL((await request(worker, { request: 'logout' })).redirect)

    expect(url.searchParams.has('id_token_hint')).to.equal(false)
  })

  it('allows signing in again afterwards', async () => {
    const worker = loadWorker()
    await signIn(worker)
    await request(worker, { request: 'logout' })

    const authorization = await request(worker, { request: 'getAccessToken' })
    queueFetch(okJson(tokenResponse({ id_token: 'id-token-2' })))
    const exchange = await request(worker, {
      request: 'exchangeCodeForToken',
      code: 'code',
      codeVerifier: authorization.codeVerifier,
      redirectUri: APP_URI,
    })

    expect(exchange.success).to.equal(true)
    const token = await request(worker, { request: 'getAccessToken' })
    expect(token.accessToken).to.be.ok
  })
})
