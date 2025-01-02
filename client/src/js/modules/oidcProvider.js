const state = {}

let token, tokenParsed, refreshToken, refreshTokenParsed
let refreshQueue = []

async function authorize({clientId, oidcProvider, scope, autoRefresh}) {
  state.clientId = clientId
  state.oidcProvider = oidcProvider
  state.autoRefresh = autoRefresh
  state.scope = scope
  state.oidcConfiguration = await getOpenIdConfiguration(oidcProvider)

  // check our URL for fragment
  const fragmentIndex = window.location.href.indexOf('#')
  if (fragmentIndex === -1) {
    // redirect to OP with authorization request
    const authUrl = await getAuthorizationUrl()
    window.location.href = authUrl
    return null
  }
  else {
    // exchange authorization_code for token
    const lastOidc = JSON.parse(localStorage.getItem('last-oidc') ?? '{}')
    lastOidc.redirectHref = window.location.href
    const [redirectUrl, paramStr] = window.location.href.split('#')
    const params = processRedirectParams(paramStr)

    if (lastOidc.state !== params.state) {
      throw new Error(`ERROR: OIDC redirection from unknown state.<br>Expected: ${lastOidc.state}<br>Actual: ${params.state}<br><br><a href="${redirectUrl}">Retry authorization.</a>`)
    }

    const beforeTime = new Date().getTime()
    const tokenRequestBody = getTokenRequestBody(params.code, lastOidc.pkce.codeVerifier, redirectUrl)
    let tokens
    try {
      lastOidc.tokenEndpoint = state.oidcConfiguration.token_endpoint
      lastOidc.tokenRequestBody = tokenRequestBody.toString()
      tokens = await requestToken(tokenRequestBody)
    }
    catch (e) {
      e.message = `<textarea readonly wrap="off" rows="18" cols="80" style="font-size: 8px;">Error:\n${e.message}\n\nContext:\n${JSON.stringify(lastOidc, null, 2)}</textarea><br><br><a href="${redirectUrl}">Retry authorization.</a>`
      throw e
    }
    const clientTime = (beforeTime + new Date().getTime()) / 2
    setTokens(tokens, clientTime)
    window.history.replaceState(window.history.state, '', redirectUrl)
    return tokens
  }
}

function logout() {
  window.location.href = state.oidcConfiguration.end_session_endpoint
}

async function updateCallback() {
  try {
    await updateToken(-1)
  }
  catch (e) {
      console.log('[OIDCPROVIDER] Error in updateCallback')
  } 
}

function expiredCallback() {
  console.log(`[OIDCPROVIDER] Token expired at ${new Date(tokenParsed.exp * 1000)}`)
}

function setTokens(tokens, clientTime) {
  state.tokens = tokens
  token = state.tokens.access_token
  refreshToken = state.tokens.refresh_token

  tokenParsed = decodeToken(token)
  refreshTokenParsed = decodeToken(refreshToken)
  
  state.timeSkew = clientTime ? Math.floor(clientTime / 1000) - tokenParsed.iat : 0
  console.log('[OIDCPROVIDER] Estimated time difference between browser and server is ' + state.timeSkew + ' seconds')
  console.log('[OIDCPROVIDER] Token expires ' + new Date(tokenParsed.exp * 1000))
  
  const tokenExpiresIn = (tokenParsed.exp - (new Date().getTime() / 1000) + state.timeSkew) * 1000
  if (tokenExpiresIn <= 0) {
    expiredCallback()
  } 
  else {
    if (state.tokenTimeoutHandle) {
      clearTimeout(state.tokenTimeoutHandle)
    }
    state.tokenTimeoutHandle = setTimeout(expiredCallback, tokenExpiresIn)
  }

  if (state.autoRefresh && refreshToken) {
    const now = new Date().getTime()
    const expiration = refreshTokenParsed ? refreshTokenParsed.exp : tokenParsed.exp
    const updateDelay = (expiration - 60 - (now / 1000) + state.timeSkew) * 1000
    if (state.refreshTimeoutHandle) {
      clearTimeout(state.refreshTimeoutHandle)
    }
    state.refreshTimeoutHandle = setTimeout(updateCallback, updateDelay)
    console.log(`[OIDCPROVIDER] Scheduled token refresh at ${new Date(now + updateDelay)}`)
  }
}

function clearTokens() {
  token = null
  refreshToken = null
  tokenParsed = null
  refreshTokenParsed = null
  state.timeSkew = 0
}

function updateToken(minValidity = 5) {
  // wrap in a Promise to handle concurrent executions
  return new Promise ((resolve, reject) => {
    if (!refreshToken) {
      if (isTokenExpired(minValidity)) {
        clearTokens()
      }
      resolve(false)
      return
    }
  
    let willRefresh = false
    if (minValidity == -1) {
      willRefresh = true
      console.log('[OIDCPROVIDER] Refreshing token: forced refresh')
    } 
    else if (isTokenExpired(minValidity)) {
      willRefresh = true
      console.log('[OIDCPROVIDER] Refreshing token: token expired')
    }
    if (!willRefresh) {
      resolve(false)
      return
    }
  
    // add this executor to the queue so we can access resolveFunc/rejectFunc
    refreshQueue.push({resolve, reject})

    // only continue if we are first in the queue
    if (refreshQueue.length === 1) {
      let beforeTime = new Date().getTime()
      requestRefresh()
      .then(tokens => {
        const clientTime = (beforeTime + new Date().getTime()) / 2
        console.log('[OIDCPROVIDER] Token refreshed')
        setTokens(tokens, clientTime)
        console.log('[OIDCPROVIDER] Estimated time difference between browser and server is ' + state.timeSkew + ' seconds')
        // resolve all executors in the queue
        for (let p = refreshQueue.pop(); p != null; p = refreshQueue.pop()) {
          p.resolve(true)
        }
      })
      .catch(e => {
        // reject all executors in the queue
        for (let p = refreshQueue.pop(); p != null; p = refreshQueue.pop()) {
          p.reject(e)
        }
      })
    }
  })
}

function isTokenExpired(minValidity) {
  if (!tokenParsed) {
    throw new Error('Not authenicated')
  }
  let expiresIn = tokenParsed.exp - Math.ceil(new Date().getTime() / 1000) + state.timeSkew
  if (minValidity) {
    if (isNaN(minValidity)) {
        throw 'Invalid minValidity'
    }
    expiresIn -= minValidity;
  }
  return expiresIn < 0
}

async function requestToken(body) {
  const response = await fetch(state.oidcConfiguration.token_endpoint, {
    method: 'post',
    body
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
  return response.json()
}

async function requestRefresh() {
  const body = getRefreshRequestBody()
  const response = await fetch(state.oidcConfiguration.token_endpoint, {
    method: 'post',
    body
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
  return response.json()
}

function getTokenRequestBody(code, codeVerifier, redirectUri) {
  const params = new URLSearchParams()
  params.append('code', code)
  params.append('grant_type', 'authorization_code')
  params.append('client_id', state.clientId)
  params.append('redirect_uri', redirectUri)
  params.append('code_verifier', codeVerifier)
    
  return params
}

function getRefreshRequestBody() {
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', state.tokens.refresh_token)
  params.append('client_id', state.clientId)
  return params
}

function processRedirectParams(paramStr) {
  const params = {}
  const usp = new URLSearchParams(paramStr)
  for (const [key, value] of usp) {
    params[key] = value
  }
  return params
}

async function getAuthorizationUrl() {
  const pkce = await getPkce()
  const oidcState = crypto.randomUUID()
  const params = new URLSearchParams()
  params.append('client_id', state.clientId)
  params.append('redirect_uri', window.location.href)
  params.append('state', oidcState)
  params.append('response_mode', 'fragment')
  params.append('response_type', 'code')
  params.append('scope', state.scope)
  params.append('nonce', crypto.randomUUID())
  params.append('code_challenge', pkce.codeChallenge)
  params.append('code_challenge_method', 'S256')

  const authEndpoint = state.oidcConfiguration.authorization_endpoint
  const authRequest = `${authEndpoint}?${params.toString()}`

  localStorage.setItem('last-oidc', JSON.stringify({
    state: oidcState,
    pkce,
    authRequest
  }))

  return authRequest
}

async function getPkce() {  
  function dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2)
  }
  
  function generateRandomString() {
    var array = new Uint32Array(56/2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join('');
  }

  function sha256(plain) { // returns promise ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
  }
  
  function base64UrlEncode(a) {
    let str = ""
    const bytes = new Uint8Array(a)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[i])
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }
  
  async function challengeFromVerifier(v) {
    const hashed = await sha256(v)
    const base64encoded = base64UrlEncode(hashed)
    return base64encoded
  }
    
  const codeVerifier = generateRandomString()
  const codeChallenge = await challengeFromVerifier(codeVerifier)
  return {codeChallenge, codeVerifier}
}

async function getOpenIdConfiguration(baseUrl) {
  let url
  try {
    url = `${baseUrl}/.well-known/openid-configuration`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`failed to get: ${url}`)
    }
    return response.json()
  }
  catch (e) {
    throw new Error(`failed to get: ${url}`)
  }
}

function decodeToken(str) {
  try {
    str = str.split('.')[1]

    str = str.replace(/-/g, '+')
    str = str.replace(/_/g, '/')
    switch (str.length % 4) {
        case 0:
            break
        case 2:
            str += '=='
            break
        case 3:
            str += '='
            break
        default:
            throw 'Invalid token'
    }
  
    str = decodeURIComponent(escape(atob(str)))
    str = JSON.parse(str)
    return str
  }
  catch (e) {
    return false
  }
}

export {
  authorize,
  logout,
  updateToken,
  state,
  token,
  tokenParsed,
  refreshToken,
  refreshTokenParsed
}