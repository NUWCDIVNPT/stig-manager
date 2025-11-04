/* eslint-disable no-undef */
import { useGlobalStateStore } from '../global-state/globalState.js'
import { setupOidcWorker } from '././oidcWorker.js'

let OW = {}

async function bootstrapAuth(pinia) {
  try {
    const result = {
      success: false,
      error: null,
    }

    OW = setupOidcWorker()
    result.oidcWorker = OW

    // Listen for noToken and accessToken events to control the global modal
    if (pinia && OW.bc) {
      const globalState = useGlobalStateStore(pinia)
      OW.bc.addEventListener('message', (event) => {
        if (event.data?.type === 'noToken') {
          globalState.setNoTokenMessage(event.data)
        }
        else if (event.data?.type === 'accessToken') {
          globalState.clearNoTokenMessage()
        }
      })
    }

    const url = new URL(window.location.href)
    const redirectUri = `${url.origin}${url.pathname}`
    const response = await OW.sendWorkerRequest({
      request: 'initialize',
      redirectUri,
      env: STIGMAN.Env.oauth,
    })

    console.log(response)
    if (response.error) {
      result.error = response.error
      return result
    }

    const paramStr = extractParamString(url)
    if (paramStr) {
      await handleRedirectAndParameters(redirectUri, paramStr)
    }
    else {
      await handleNoParameters()
    }
    result.success = true
    return result
  }
  catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function extractParamString(url) {
  if (url.hash) {
    return url.hash.substring(1)
  }
  if (url.search) {
    return url.search.substring(1)
  }
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

async function handleNoParameters() {
  const response = await OW.sendWorkerRequest({ request: 'getAccessToken' })
  if (response.accessToken) {
    OW.token = response.accessToken
    OW.tokenParsed = response.accessTokenPayload
    return true
  }
  else if (response.redirect) {
    sessionStorage.setItem('codeVerifier', response.codeVerifier)
    sessionStorage.setItem('oidcState', response.state)
    window.location.href = response.redirect
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
    console.error(errorMessage)
    return
  }
  if (!params.state || params.state !== sessionStorage.getItem('oidcState')) {
    const reauthHref = window.location.origin + window.location.pathname
    console.log(`[init] State mismatch. Redirecting to ${reauthHref}.`)
    window.location.href = reauthHref
    return
  }
  const response = await OW.sendWorkerRequest({
    request: 'exchangeCodeForToken',
    code: params.code,
    codeVerifier: sessionStorage.getItem('codeVerifier'),
    clientId: STIGMAN.Env.oauth.clientId,
    redirectUri,
  })
  if (response.success) {
    OW.token = response.accessToken
    OW.tokenParsed = response.accessTokenPayload
    window.history.replaceState(window.history.state, '', redirectUri)
    sessionStorage.removeItem('codeVerifier')
    sessionStorage.removeItem('oidcState')
    return true
  }
  else {
    console.log(response.error || 'Failed to exchange code for token')
  }
}

export { bootstrapAuth }
