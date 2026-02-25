console.log('import.meta.env:', import.meta.env)
if (import.meta.env.DEV) {
  STIGMAN.Env.apiBase = `${import.meta.env.VITE_API_ORIGIN}/api`
} else if (STIGMAN.Env.pathPrefix) {
  STIGMAN.Env.apiBase = `${window.location.origin}${STIGMAN.Env.pathPrefix}api`
} else {
  STIGMAN.Env.apiBase = new URL(`../api`, window.location.href).toString() // change when nextgen client is served from root instead of /client-v2
}
STIGMAN.Env.apiUrl = STIGMAN.Env.apiBase

const statusEl = document.getElementById("loading-text")
let OW // aka STIGMAN.oidcWorker, created in setupOidcWorker()
if (!window.isSecureContext) {
  appendStatus(`SECURE CONTEXT REQUIRED<br><br>
  The App is not executing in a <a href=https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts target="_blank">secure context</a> and cannot continue.
  <br><br>To be considered secure, resources that are not local must be served over https:// URLs and the security 
  properties of the network channel used to deliver the resource must not be considered deprecated.`)
} else {
  try {
    console.log('[init] STIGMAN.Env:', STIGMAN.Env)
    console.log('[init] STIGMAN.Env.stateEvents:', STIGMAN.Env.stateEvents)
    await setupStateWorker()
    await setupOidcWorker()
    const authorized = await authorize()
    if (authorized) {
      await setupServiceWorker()
      appendStatus('Fetching user profile')
      const userObj = await getUserObject()
      if (userObj) {
        STIGMAN.curUser = userObj
        loadApp()
      }
    }
  }
  catch (error) {
    console.error(`[init] Error during initialization:`, error)
    appendError(error.message || 'Unknown error during initialization', !error.message?.includes('Timeout waiting for API state event stream'))
  }
}

async function authorize() {
  const url = new URL(window.location.href)
  const redirectUri = `${url.origin}${url.pathname}`
  const hash = url.hash

  appendStatus(`Authorizing`)

  const paramStr = extractParamString(url)
  if (paramStr) {
    return handleRedirectAndParameters(redirectUri, paramStr)
  }
  else {
    return handleNoParameters(redirectUri, hash)
  }

}

async function getOidcMetadata() {
  const url = `${STIGMAN.Env.oauth.authority}/.well-known/openid-configuration`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`failed to get: ${url}`)
  }
  try {
    return await response.json()
  } catch (error) {
    console.error(`[init] Error fetching OIDC metadata:`, error)
    throw new Error(`failed to parse: ${url}`)
  }
}

async function initializeOidcWorker() {
  const response = await OW.sendWorkerRequest({ request: 'getStatus' })
  if (response.error) {
    throw new Error(`OIDC Worker getStatus error: ${response.error}`)
  }
  if (response.initialized) {
    return response
  }
  const oidcConfiguration = await getOidcMetadata()
  let reauthUri
  if (import.meta.env.DEV) {
    reauthUri = `${window.location.origin}/reauth.html`
  } else {
  // Change first condition when nextgen client is served from root instead of /client-v2
    reauthUri = STIGMAN.Env.pathPrefix ? 
    `${window.location.origin}${STIGMAN.Env.pathPrefix}client-v2/reauth.html` :
    `${window.location.origin}${window.location.pathname}reauth.html`
  }
  return OW.sendWorkerRequest({ 
    request: 'initialize', 
    oidcConfiguration, 
    env: STIGMAN.Env.oauth,
    reauthUri
   })
}

function extractParamString(url) {
  // if (url.hash) return url.hash.substring(1) // Remove the leading '#'
  if (url.search) return url.search.substring(1) // Remove the leading '?'
  return ''
}

function processRedirectParams(paramStr) {
  const params = {}
  const usp = new URLSearchParams(paramStr)
  for (const [key, value] of usp) {
    params[key] = value
  }
  return params
}

async function handleNoParameters(redirectUri, hash) {
  const response = await OW.sendWorkerRequest({ request: 'getAccessToken', redirectUri })
  if (response.accessToken) {
    OW.token = response.accessToken
    OW.tokenParsed = response.accessTokenPayload
    return true
  }
  else if (response.redirectOidc) {
    sessionStorage.setItem('codeVerifier', response.codeVerifier)
    sessionStorage.setItem('oidcState', response.state)
    sessionStorage.setItem('hash', hash)
    window.location.href = response.redirectOidc
    return false
  }
}

async function handleRedirectAndParameters(redirectUri, paramStr) {
  const params = processRedirectParams(paramStr)
  if (!params.code) {
    let errorMessage = 'No authorization code provided in the URL parameters.'
    if (params.error) {
      errorMessage += ` Error: ${params.error}`
      if (params.error_description) {
        errorMessage += ` - ${params.error_description}`
      }
    }
    appendError(errorMessage)
    return false
  }
  if (!params.state || params.state !== sessionStorage.getItem('oidcState')) {
    const reauthHref = window.location.origin + window.location.pathname
    console.log(`[init] State mismatch. Redirecting to ${reauthHref}.`)
    window.location.href = reauthHref
    return false
  }
  const response = await OW.sendWorkerRequest({
    request: 'exchangeCodeForToken',
    code: params.code,
    codeVerifier: sessionStorage.getItem('codeVerifier'),
    clientId: STIGMAN.Env.oauth.clientId,
    redirectUri
  })
  if (response.success) {
    OW.token = response.accessToken
    OW.tokenParsed = response.accessTokenPayload
    window.history.replaceState(window.history.state, '', redirectUri + sessionStorage.getItem('hash')) // restore original hash if it existed
    sessionStorage.removeItem('codeVerifier')
    sessionStorage.removeItem('oidcState')
    sessionStorage.removeItem('hash')
    return true
  }
  else {
    appendError(response.error || 'Failed to exchange code for token')
    return false
  }
}

function appendStatus(html) {
  statusEl.innerHTML += `${statusEl.innerHTML ? '<br/><br/>' : ''}${html}`
}

function setStatus(html) {
  statusEl.innerHTML = html
}

function appendError(message, showReauth = true) {
  if (showReauth) {
    const reauthHref = window.location.origin + window.location.pathname
    statusEl.innerHTML += `<br/><br/><span style="color:#ff5757">Error: ${message}</span><br><br><a href="${reauthHref}">Retry authorization.</a>`
  }
  else {
    statusEl.innerHTML += `<br/><br/><span style="color:#ff5757">Error: ${message}</span>`
  }
  hideSpinner()
}

async function loadApp() {
  const loadingMask = document.getElementById('loading-mask')
  if (loadingMask) {
    loadingMask.remove()
  }
  import('./main.js').catch((error) => {
    console.error('Failed to load main.js:', error)
    appendError(`Failed to load application: ${error.message || 'Unknown error'}`, false)
  })
}

async function setupOidcWorker() {
  STIGMAN.oidcWorker = {
    logout: async function () {
      const response = await this.sendWorkerRequest({ request: 'logout' })
      if (response.success) {
        this.token = null
        this.tokenParsed = null
        window.location.href = response.redirect
      }
    },
    sendWorkerRequest: function (request) {
      const requestId = crypto.randomUUID()
      const port = this.worker.port
      port.postMessage({ ...request, requestId })
      return new Promise((resolve) => {
        function handler(event) {
          if (event.data.requestId === requestId) {
            port.removeEventListener('message', handler)
            resolve(event.data.response)
          }
        }
        port.addEventListener('message', handler)
      })
    },
    postContextActiveMessage: function () {
      this.worker.port.postMessage({ requestId: 'contextActive' })
    },
    channelName: null,
    token: null,
    tokenParsed: null,
    worker: new SharedWorker(import.meta.env.BASE_URL + "workers/oidc-worker.js", { name: 'stigman-oidc-worker', type: "module" })
  }

  OW = STIGMAN.oidcWorker
  OW.worker.port.start()
  const response = await initializeOidcWorker()
  if (response.error) {
    appendError(response.error)
    return
  }
  OW.channelName = response.channelName
  const bc = new BroadcastChannel(STIGMAN.oidcWorker.channelName)
  bc.onmessage = (event) => {
    if (event.data.type === 'accessToken') {
      console.log('{init] Received from worker:', event.type, event.data)
      OW.token = event.data.accessToken
      OW.tokenParsed = event.data.accessTokenPayload
    }
    else if (event.data.type === 'noToken') {
      console.log('{init] Received from worker:', event.type, event.data)
      OW.token = null
      OW.tokenParsed = null
    }
  }
}

async function setupStateWorker() {
  if (!STIGMAN.Env.stateEvents) {
    console.log('[init] STIGMAN_CLIENT_STATE_EVENTS is false; skipping state worker setup')
    return
  }

  STIGMAN.stateWorker = {
    worker: new SharedWorker(import.meta.env.BASE_URL + "workers/state-worker.js", { name: 'stigman-state-worker', type: "module" }),
    sendWorkerRequest: function (request) {
      const requestId = crypto.randomUUID()
      const port = this.worker.port
      port.postMessage({ ...request, requestId })
      return new Promise((resolve) => {
        function handler(event) {
          if (event.data.requestId === requestId) {
            port.removeEventListener('message', handler)
            resolve(event.data.response)
          }
        }
        port.addEventListener('message', handler)
      })
    },
    workerChannel: null,
    state: null
  }
  const SW = STIGMAN.stateWorker
  SW.worker.port.start()

  // const apiBase = import.meta.env.DEV || STIGMAN.Env.pathPrefix? STIGMAN.Env.apiBase : `../${STIGMAN.Env.apiBase}` // ensure correct relative path in development vs production
  const response = await SW.sendWorkerRequest({ request: 'initialize', apiBase: STIGMAN.Env.apiBase })
  if (response.error) {
    console.error(`[init] Error initializing state worker:`, response.error)
    throw new Error(response.error)
  }
  SW.state = JSON.parse(response.state)

  // Set up the workerChannel before waiting for available state
  SW.workerChannel = new BroadcastChannel(response.channelName)
  SW.workerChannel.onmessage = (event) => {
    console.log(`[init] [${SW.workerChannel.name}] Received message:`, event.data)
    try {
      SW.state = JSON.parse(event.data.data)
    } catch (error) {
      console.error(`[init] [${SW.workerChannel.name}] Error parsing state:`, error)
      SW.state = null
    }
  }

  // Wait for currentState == 'available'
  function needsWait(state) {
    if (!state) return true
    const online = '<span style="color:green">ONLINE</span>'
    const offline = '<span style="color:#ff5757">OFFLINE</span>'
    if (state.currentState !== 'available') {
      setStatus(`The API is currently ${state.currentState}.<br><br>
          Database status: ${state.dependencies.db ? online : offline}<br>
          OIDC status: ${state.dependencies.oidc ? online : offline}<br><br>
          Last update: ${new Date().toISOString()}`)
      return true
    }
    return false
  }

  if (needsWait(SW.state)) {
    await new Promise((resolve) => {
      function checkReady(event) {
        let stateObj;
        try {
          stateObj = JSON.parse(event.data.data)
        } catch {
          return
        }
        if (!needsWait(stateObj)) {
          SW.workerChannel.removeEventListener('message', checkReady)
          SW.state = stateObj
          resolve()
        }
      }
      SW.workerChannel.addEventListener('message', checkReady)
    })
  }

  return true
}

async function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('workers/service-worker.js')
      appendStatus('Service Worker registered successfully')
    }
    catch (err) {
      appendError(`Service Worker registration failed: ${err}`)
    }
  }
}

async function getUserObject() {
  const response = await fetch(`${STIGMAN.Env.apiBase}/user?projection=webPreferences`, {
    headers: {
      'Authorization': `Bearer ${STIGMAN.oidcWorker.token}`
    }
  })
  return await response.json()
}

function hideSpinner() {
  const loadingEl = document.getElementById("indicator")
  if (loadingEl) {
    loadingEl.style.background = "none"
  }
}
