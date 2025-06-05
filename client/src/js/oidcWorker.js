const logPrefix = '[OIDCWorker]:'

// Private state
const tokens = {
  accessToken: null,
  refreshToken: null
}
let ENV = null
let oidcProvider = null
let oidcConfiguration = null
let initialized = false
let authorizations = {}
let accessTimeoutId = null
let refreshTimeoutId = null
let redirectUri = null
let clientId = null
let autoRefresh = null
let scope = null
let responseMode = null
const bc = new BroadcastChannel('stigman-oidc-worker')

// Utility functions
function dec2hex(dec) {
  return ('0' + dec.toString(16)).substr(-2)
}
function generateRandomString() {
  const array = new Uint32Array(56 / 2)
  crypto.getRandomValues(array)
  return Array.from(array, dec2hex).join('')
}
async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}
function base64UrlEncode(a) {
  let str = ''
  const bytes = new Uint8Array(a)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
async function challengeFromVerifier(v) {
  const hashed = await sha256(v)
  const base64encoded = base64UrlEncode(hashed)
  return base64encoded
}
function decodeToken(str) {
  try {
    str = str.split('.')[1]
    str = str.replace(/-/g, '+')
    str = str.replace(/_/g, '/')
    switch (str.length % 4) {
      case 0: break
      case 2: str += '=='; break
      case 3: str += '='; break
      default: throw new Error('Invalid token')
    }
    str = decodeURIComponent(escape(atob(str)))
    str = JSON.parse(str)
    return str
  } catch {
    return false
  }
}

// Core logic
async function initialize(options) {
  if (!initialized) {
    initialized = true
    redirectUri = options.redirectUri
    ENV = options.env || null

    oidcProvider = ENV.authority
    clientId = ENV.clientId
    autoRefresh = ENV.autoRefresh
    scope = getScopeStr()
    responseMode = ENV.responseMode
    try {
      oidcConfiguration = await fetchOpenIdConfiguration()
    }
    catch (e) {
      console.error(logPrefix, 'Failed to fetch OIDC configuration', e)
      return { success: false, error: 'Cannot connect to the Sign-in Service.' }
    }
    const validation = validateOidcConfiguration()
    if (!validation.success) {
      console.error(logPrefix, 'OIDC configuration validation failed', validation.error)
      return { success: false, error: validation.error }
    }
  }
  return { success: true, env: ENV }
}

function validateOidcConfiguration() {
  const result = {
    success: true
  }
  if (!oidcConfiguration?.authorization_endpoint) {
    result.success = false
    result.error = 'Missing authorization endpoint in OIDC configuration'
  } else if (!oidcConfiguration?.token_endpoint) {
    result.success = false
    result.error = 'Missing token endpoint in OIDC configuration'
  } else if (!oidcConfiguration?.code_challenge_methods_supported?.includes('S256')) {
    result.success = false
    result.error = 'PKCE with S256 not supported by OIDC provider'
  }
  return result 
}


function getScopeStr() {
  const scopePrefix = ENV.scopePrefix
  let scopes = [
    `openid`,
    `${scopePrefix}stig-manager:stig`,
    `${scopePrefix}stig-manager:stig:read`,
    `${scopePrefix}stig-manager:collection`,
    `${scopePrefix}stig-manager:user`,
    `${scopePrefix}stig-manager:user:read`,
    `${scopePrefix}stig-manager:op`
  ]
  if (ENV.extraScopes) {
    scopes.push(...ENV.extraScopes.split(" "))
  }
  return scopes.join(" ")
}

async function fetchOpenIdConfiguration() {
  if (oidcConfiguration) {
    return oidcConfiguration
  }
  const url = `${oidcProvider}/.well-known/openid-configuration`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`failed to get: ${url}`)
  }
  oidcConfiguration = await response.json()
  return oidcConfiguration
}

async function createAuthorization(_redirectUri = redirectUri) {
  if (authorizations[_redirectUri]) return authorizations[_redirectUri]
  const pkce = await getPkce()
  const state = crypto.randomUUID()
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('redirect_uri', _redirectUri)
  params.append('state', state)
  params.append('response_mode', responseMode)
  params.append('response_type', 'code')
  params.append('scope', scope)
  params.append('nonce', crypto.randomUUID())
  params.append('code_challenge', pkce.codeChallenge)
  params.append('code_challenge_method', 'S256')
  params.append('display', 'popup')

  const authEndpoint = oidcConfiguration.authorization_endpoint
  const redirect = `${authEndpoint}?${params.toString()}`
  authorizations[_redirectUri] = { redirect, codeVerifier: pkce.codeVerifier, state }
  return authorizations[_redirectUri]
}

async function getPkce() {
  const codeVerifier = generateRandomString()
  const codeChallenge = await challengeFromVerifier(codeVerifier)
  return { codeChallenge, codeVerifier }
}

function getAccessToken() {
  if (!tokens.accessToken) {
    console.log(logPrefix, 'getAccessToken, redirecting to authorization')
    return createAuthorization()
  }
  return {
    accessToken: tokens.accessToken,
    accessTokenPayload: decodeToken(tokens.accessToken)
  }
}

async function broadcastNoToken() {
  console.log(logPrefix, 'Broadcasting no token')
  let baseRedirectUri = redirectUri?.endsWith('index.html')
    ? redirectUri.slice(0, -'index.html'.length)
    : redirectUri

  const auth = await createAuthorization(`${baseRedirectUri}reauth.html`)
  bc.postMessage({ type: 'noToken', ...auth })
}

function broadcastToken() {
    bc.postMessage({
    type: 'accessToken',
    accessToken: tokens.accessToken,
    accessTokenPayload: decodeToken(tokens.accessToken)
  })
}

function clearAccessTokenTimer() {
  if (accessTimeoutId) {
    clearTimeout(accessTimeoutId)
    accessTimeoutId = null
  }
}

function clearRefreshTokenTimer() {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId)
    refreshTimeoutId = null
  }
}

function setAccessTokenTimer(delayMs) {
  clearAccessTokenTimer()
  accessTimeoutId = setTimeout(async () => {
    if (tokens.accessToken) {
      clearAccessToken()
      console.log(logPrefix, 'Access token timeout handler is attempting refresh')
      await refreshAccessToken()
    }
  }, delayMs)
}
function setRefreshTokenTimer(delayMs) {
  clearRefreshTokenTimer()
  refreshTimeoutId = setTimeout(async () => {
    if (tokens.refreshToken) {
      console.log(logPrefix, 'Refresh token timeout handler is broadcasting no token')
      clearTokens(true) // broadcast no token
    }
  }, delayMs)
}
function getTokenTimes(token, timeoutBufferS = 10) {
  const expS = decodeToken(token)?.exp
  if (!expS) {
    console.log(logPrefix, 'No access token expiration claim')
    return null
  }
  const nowMs = Date.now()
  const nowS = Math.floor(nowMs / 1000)
  const expiresDate = new Date(expS * 1000)
  const expiresDateISO = expiresDate.toISOString()
  const expiresInS = expS - nowS
  const expiresInMs = expiresInS * 1000
  const timeoutInS = Math.min(expiresInS - timeoutBufferS, 2147483) // max timeout for setTimeout
  const timeoutInMs = timeoutInS * 1000
  const timeoutDate = new Date((nowS + timeoutInS) * 1000)
  const timeoutDateISO = timeoutDate.toISOString()

  return {
    expS,
    expiresDate,
    expiresDateISO,
    expiresInS,
    expiresInMs,
    timeoutDate,
    timeoutDateISO,
    timeoutInS,
    timeoutInMs
  }
}
function setTokensAccessOnly(tokensResponse) {
  const accessTimes = getTokenTimes(tokensResponse.access_token)
  if (!accessTimes || accessTimes.timeoutInS <= 0) {
    broadcastNoToken()
    return
  }
  tokens.accessToken = tokensResponse.access_token
  broadcastToken()
  console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
  setAccessTokenTimer(accessTimes.timeoutInMs)
}
function setTokensWithRefresh(tokensResponse) {
  const accessTimes = getTokenTimes(tokensResponse.access_token)
  const refreshTimes = getTokenTimes(tokensResponse.refresh_token, 0) // no timeout buffer for refresh token

  if (!accessTimes || accessTimes.timeoutInS <= 0) {
    broadcastNoToken()
    return
  } else {
    tokens.accessToken = tokensResponse.access_token
    broadcastToken()
  }
  if (refreshTimes.timeoutInS > 0) {
    tokens.refreshToken = tokensResponse.refresh_token
    console.log(logPrefix, 'Refresh token expires: ', refreshTimes.expiresDateISO, ' timeout: ', refreshTimes.timeoutDateISO)
    setRefreshTokenTimer(refreshTimes.timeoutInMs)
  } else {
    // how would we end up here?
    console.log(logPrefix, 'Refresh has expired, Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
    setAccessTokenTimer(accessTimes.timeoutInMs)
  }
  if (accessTimes.expiresInS < refreshTimes.expiresInS) {
    console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
    setAccessTokenTimer(accessTimes.timeoutInMs)
  } else {
    console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout disabled')
  }
}
function processTokenResponseAndSetTokens(tokensResponse) {
  console.log(logPrefix, 'Token response', tokensResponse)
  clearTokens()
  if (tokensResponse.access_token && tokensResponse.refresh_token) {
    setTokensWithRefresh(tokensResponse)
    return true
  }
  if (tokensResponse.access_token) {
    setTokensAccessOnly(tokensResponse)
    return true
  }
  console.error(logPrefix, 'No access_token in tokensResponse:', tokensResponse)
  clearTokens(true) // broadcast no token
  return false
}
function clearAccessToken(sendBroadcast = false) {
  tokens.accessToken = null
  clearAccessTokenTimer()
  if (sendBroadcast) broadcastNoToken()
}
function clearTokens(sendBroadcast = false) {
  tokens.accessToken = null
  tokens.refreshToken = null
  clearAccessTokenTimer()
  clearRefreshTokenTimer()
  if (sendBroadcast) broadcastNoToken()
}
async function refreshAccessToken() {
  if (!tokens.refreshToken) {
    await broadcastNoToken()
    return
  }
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('client_id', clientId)
  params.append('refresh_token', tokens.refreshToken)

  let response
  let tokensResponse
  try {
    response = await fetch(oidcConfiguration.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })
  }
  catch (e) {
    console.error(logPrefix, 'Refresh token fetch error', e)
    clearTokens(true)
    return {
      success: false,
      error: 'Failed to fetch from token endpoint'
    }
  }
  try {
    tokensResponse = await response.json()
  }
  catch (e) {
    console.error(logPrefix, 'Refresh token response parse error', e)
    clearTokens(true)
    return {
      success: false,
      error: 'Failed to parse response from token endpoint'
    }
  }
  if (!response.ok) {
    console.error(logPrefix, 'Token refresh error response', tokensResponse)
    clearTokens(true)
  } else {
    processTokenResponseAndSetTokens(tokensResponse)
    return {
      success: true,
      accessToken: tokens.accessToken,
      accessTokenPayload: decodeToken(tokens.accessToken)
    }
  }
}
async function exchangeCodeForToken({ code, codeVerifier, clientId = 'stig-manager', redirectUri }) {
  if (authorizations[redirectUri] && authorizations[redirectUri].codeVerifier !== codeVerifier) {
    // verifier does not match the saved redirectUri
    console.error(logPrefix, 'Code verifier does not match the saved redirectUri', redirectUri, authorizations[redirectUri])
    return { success: false, error: 'Code verifier does not match the saved redirectUri' }
  }

  console.log(logPrefix, 'Exchange code for token', code, codeVerifier)

  delete authorizations[redirectUri]
  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('client_id', clientId)
  params.append('redirect_uri', redirectUri)
  params.append('code', code)
  params.append('code_verifier', codeVerifier)

  let tokensResponse
  let response
  try {
    response = await fetch(oidcConfiguration.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })
  }
  catch (e) {
    console.error(logPrefix, 'Exchange code fetch error', e)
    return { success: false, error: 'Failed to fetch from token endpoint' }
  }

  try {
    tokensResponse = await response.json()
  }
  catch (e) {
    console.error(logPrefix, 'Exchange code response parse error', e)
    return { success: false, error: 'Failed to parse response from token endpoint' }
  }

  if (!response.ok) {
    return { success: false, error: tokensResponse.error_description }
  }
  if (!processTokenResponseAndSetTokens(tokensResponse)) {
    console.error(logPrefix, 'Failed to process token response', tokensResponse)
    return { success: false, error: 'Failed to process token response' }
  } else {
    return {
      success: true,
      accessToken: tokens.accessToken,
      accessTokenPayload: decodeToken(tokens.accessToken)
    }
  }
}

// Logout function
function logout() {
  return {
    success: true,
    redirect: oidcConfiguration.end_session_endpoint
  }
}

// Message handler
async function onMessage(e) {
  const port = e.target
  const { requestId, request, ...options } = e.data
  const handler = messageHandlers[request]
  if (handler) {
    try {
      const response = await handler(options)
      port.postMessage({ requestId, response })
    } catch (error) {
      port.postMessage({ requestId, error: error.message })
    }
  } else {
    port.postMessage({ requestId, error: 'Unknown request' })
  }
}

const messageHandlers = {
  getAccessToken,
  exchangeCodeForToken,
  initialize,
  logout
}

// Worker entry point
onconnect = function (e) {
  const port = e.ports[0]
  port.onmessage = onMessage
  port.start()
}
