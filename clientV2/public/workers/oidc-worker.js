const logPrefix = '[OIDCWorker]:'

// Private state
const tokens = {
  accessToken: null,
  refreshToken: null
}
let ENV = null
let oidcConfiguration = null
let initialized = false
let authorizations = {}
let accessTimeoutId = null
let refreshTimeoutId = null
let redirectUri = null
const channelName = crypto.randomUUID()
const bc = new BroadcastChannel(channelName)
let idleTimeoutId = null
let idleTimeoutM = null
let isIdle = false

// Worker entry point
onconnect = function (e) {
  const port = e.ports[0]
  port.onmessage = onMessage
  port.start()
}

// Message handlers
const messageHandlers = {
  getAccessToken,
  exchangeCodeForToken,
  initialize,
  getStatus,
  logout
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

async function exchangeCodeForToken({ code, codeVerifier, clientId = ENV.clientId, redirectUri }) {
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

  try {
    isIdle = false
    await fetchTokens(params)
    return {
      success: true,
      accessToken: tokens.accessToken,
      accessTokenPayload: decodeToken(tokens.accessToken)
    }
  }
  catch (e) {
    return { success: false, error: e.message}
  }
}

async function initialize(options) {
  if (!initialized) {
    initialized = true
    redirectUri = options.redirectUri
    ENV = options.env || null

    try {
      oidcConfiguration = options.oidcConfiguration || await fetchOpenIdConfiguration()
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
  return { success: true, env: ENV, channelName }
}

async function getStatus() {
  return {
    initialized,
    redirectUri,
    env: ENV,
    channelName
  }
}

function logout() {
  return {
    success: true,
    redirect: oidcConfiguration.end_session_endpoint
  }
}

async function onMessage(e) {
  const port = e.target
  const { requestId, request, ...options } = e.data
  if (requestId === 'contextActive' && tokens.accessToken && idleTimeoutM) {
      console.log(logPrefix, 'Received contextActive message, setting idle handler')
      isIdle = false
      setIdleHandler()
  } else {
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
}

// Support functions
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

function validateOidcConfiguration() {
  const result = {
    success: true
  }
  if (!oidcConfiguration.authorization_endpoint) {
    result.success = false
    result.error = 'Missing authorization endpoint in OIDC configuration'
  } else if (!oidcConfiguration.token_endpoint) {
    result.success = false
    result.error = 'Missing token endpoint in OIDC configuration'
  } else if (ENV.strictPkce && !oidcConfiguration.code_challenge_methods_supported?.includes('S256')) {
    result.success = false
    result.error = 'OP does not advertise PKCE and STIGMAN_CLIENT_STRICT_PKCE=true'
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
  const url = `${ENV.authority}/.well-known/openid-configuration`
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
  params.append('client_id', ENV.clientId)
  params.append('redirect_uri', _redirectUri)
  params.append('state', state)
  params.append('response_mode', ENV.responseMode)
  params.append('response_type', 'code')
  params.append('scope', getScopeStr())
  params.append('nonce', crypto.randomUUID())
  params.append('code_challenge', pkce.codeChallenge)
  params.append('code_challenge_method', 'S256')

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

async function broadcastNoToken() {
  console.log(logPrefix, 'Broadcasting no token')
  let baseRedirectUri = redirectUri?.endsWith('index.html')
    ? redirectUri.slice(0, -'index.html'.length)
    : redirectUri

  const auth = await createAuthorization(`${baseRedirectUri}reauth.html`)
  bc.postMessage({ type: 'noToken', ...auth, isIdle })
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
  if (idleTimeoutM && !idleTimeoutId) {
    setIdleHandler()
  }

}

function setTokensWithRefresh(tokensResponse) {
  const accessTimes = getTokenTimes(tokensResponse.access_token)
  const refreshTimes = getTokenTimes(tokensResponse.refresh_token, 0) // no timeout buffer for refresh token

  if (accessTimes?.timeoutInS <= 0) {
    broadcastNoToken()
    return
  } else {
    tokens.accessToken = tokensResponse.access_token
    broadcastToken()
  }
  if (refreshTimes?.timeoutInS > 0) {
    tokens.refreshToken = tokensResponse.refresh_token
    console.log(logPrefix, 'Refresh token expires: ', refreshTimes.expiresDateISO, ' timeout: ', refreshTimes.timeoutDateISO)
    setRefreshTokenTimer(refreshTimes.timeoutInMs)
  } else {
    console.log(logPrefix, 'Refresh expiration unknown or zero, Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
    tokens.refreshToken = tokensResponse.refresh_token ?? null
    setAccessTokenTimer(accessTimes.timeoutInMs)
    return
  }
  if (accessTimes.expiresInS < refreshTimes?.expiresInS) {
    console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
    setAccessTokenTimer(accessTimes.timeoutInMs)
  } else {
    console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout disabled')
  }
  if (idleTimeoutM && !idleTimeoutId) {
    setIdleHandler()
  }
}

function validateTokensResponse(tokensResponse) {
  if (!tokensResponse.access_token) {
    throw new Error('No access_token in tokensResponse')
  }
  const accessPayload = decodeToken(tokensResponse.access_token)
  if (!accessPayload) {
    throw new Error('Invalid access_token in tokensResponse')
  }
  validateAudience(accessPayload)
  validateClaims(accessPayload)
  return true
}

function validateScope(scopeValue, isAdmin = false) {
  // Depending on OIDC provider, scopeValue can be a space-separated string (the standard) or an array of scopes. If a string, split it on spaces into an array.
  const scopes = typeof scopeValue === 'string' ? scopeValue.split(' ')
	    : Array.isArray(scopeValue) ? scopeValue
	    : []
  const hasScope = (s) => scopes.includes(s)

  // Required scopes for each privilege
  const requiredAdminScopes = [
    'stig-manager:stig',
    'stig-manager:user',
    'stig-manager:op',
    'stig-manager:collection'
  ]
  const requiredUserScopes = [
    'stig-manager:stig:read',
    'stig-manager:user:read',
    'stig-manager:collection'
  ]

  // Top-level scope grants all
  if (hasScope('stig-manager')) return true

  const required = isAdmin ? requiredAdminScopes : requiredUserScopes
  for (const s of required) {
    if (!hasScope(s)) {
      throw new Error(`Missing required scope "${ENV.scopePrefix}${s}" for ${isAdmin ? 'admin' : 'user'} in access token payload. Received scopes: ${JSON.stringify(scopeValue)}`)
    }
  }
  return true
}

function validateClaims(payload) {
  if (!payload[ENV.claims.scope]) {
    throw new Error(`Missing scope claim (${ENV.claims.scope}) in access token payload`)
  }
  if (!payload[ENV.claims.username]) {
    throw new Error(`Missing username claim (${ENV.claims.username}) in access token payload`)
  }
  
  const privilegeChain = ENV.claims.privileges.split('.').map(p => p.replace(/(^")|("$)/g, ''))
  const privileges = privilegeChain.reduce((obj, key) => obj?.[key], payload)
  if (!privileges) {
    throw new Error(`Missing privileges claim (${ENV.claims.privileges}) in access token payload`)
  }

  // move idle handling out of here eventually
  if (privileges.includes('admin')) {
    idleTimeoutM = ENV.idleTimeoutAdmin
  } else {
    idleTimeoutM = ENV.idleTimeoutUser
  }

  validateScope(payload[ENV.claims.scope], privileges.includes('admin'))

  return true
}

function validateAudience(payload) {
  if (ENV.audienceValue) {
    if (Array.isArray(payload.aud)) {
      if (!payload.aud.includes(ENV.audienceValue)) {
        throw new Error(`Invalid audience in access token payload: ${payload.aud.join(', ')}, expected: ${ENV.audienceValue}`)
      } 
    }
    else if (typeof payload.aud === 'string') {
      if (payload.aud !== ENV.audienceValue) {
        throw new Error(`Invalid audience in access token payload: ${payload.aud}, expected: ${ENV.audienceValue}`)
      }
    } else {
      throw new Error(`Invalid audience type in access token payload: ${typeof payload.aud}, expected string or array`)
    }
  }
  return true
}

function setTokens(tokensResponse) {
  clearTokens()
  if (tokensResponse.access_token && tokensResponse.refresh_token) {
    setTokensWithRefresh(tokensResponse)
    return true
  }
  if (tokensResponse.access_token) {
    setTokensAccessOnly(tokensResponse)
    return true
  }
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

async function fetchTokens(params) {
  if (isIdle) {
    console.log(logPrefix, 'Contexts are idle, will not fetch tokens')
    return
  }
  const response = await fetch(oidcConfiguration.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })
  if (isIdle) {
    console.log(logPrefix, 'Contexts are idle, will not get tokens response')
    return
  }
  const tokensResponse = await response.json()
  console.log(logPrefix, 'Tokens response received', Date.now(), tokensResponse)
  if (isIdle) {
    console.log(logPrefix, 'Contexts are idle, will not validate and set tokens')
    return
  }

  if (!response.ok) {
    throw new Error(tokensResponse.error_description)
  }
  validateTokensResponse(tokensResponse)
  setTokens(tokensResponse)
}

async function refreshAccessToken() {
  if (!tokens.refreshToken) {
    await broadcastNoToken()
    return
  }
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('client_id', ENV.clientId)
  params.append('refresh_token', tokens.refreshToken)

  try {
    return await fetchTokens(params)
  }
  catch (e) {
    clearTokens(true) // broadcast no token
    return { success: false, error: e.message}
  }
}

function setIdleHandler() {
  clearTimeout(idleTimeoutId)
  if (idleTimeoutM) {
    const idleTimeoutMs = idleTimeoutM * 60 * 1000 // convert minutes to milliseconds
    const idleTimeoutDate = new Date(Date.now() + idleTimeoutMs).toISOString()
    idleTimeoutId = setTimeout(() => {
      console.log(logPrefix, 'Idle timeout reached, clearing tokens with broadcast')
      idleTimeoutId = null
      isIdle = true
      clearTokens(true) // broadcast no token
    }, idleTimeoutMs) // default to 15 minutes if not set
    console.log(logPrefix, 'Idle handler installed, timeout set for', idleTimeoutDate)
  }
}

