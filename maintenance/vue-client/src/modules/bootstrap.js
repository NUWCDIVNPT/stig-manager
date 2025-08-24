import { setupOidcWorker } from './oidcWorker.js'

let OW = {}

async function bootstrap() {

  const result = {
    success: false,
    error: null
  }

  OW = setupOidcWorker()
  result.oidcWorker = OW

  const url = new URL(window.location.href)
  const redirectUri = `${url.origin}${url.pathname}${url.hash}`
  const response = await OW.sendWorkerRequest({ request: 'initialize', redirectUri, env: STIGMAN.Env.oauth })

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

function extractParamString(url) {
  // if (url.hash && !url.hash.startsWith('#/')) return url.hash.substring(1) // Remove the leading '#'
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

async function handleNoParameters() {
  const response = await OW.sendWorkerRequest({ request: 'getAccessToken' })
  if (response.accessToken) {
    OW.token = response.accessToken
    OW.tokenParsed = response.accessTokenPayload
    return true
  } else if (response.redirect) {
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
    console.log(errorMessage)
    return
  }
  if (!params.state || params.state !== sessionStorage.getItem('oidcState')) {
    console.log('State mismatch. The state parameter does not match the expected value.')
    return
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
    window.history.replaceState(window.history.state, '', redirectUri)
    sessionStorage.removeItem('codeVerifier')
    sessionStorage.removeItem('oidcState')
    return true
  }
  else {
    console.log(response.error || 'Failed to exchange code for token')
  }
}

export { bootstrap }