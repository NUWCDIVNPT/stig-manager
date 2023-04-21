import { stylesheets, scripts, isMinimizedSource } from './resources.js'
import * as OP from './oidcProvider.js'

function getScopeStr() {
  const scopePrefix = STIGMAN.Env.oauth.scopePrefix
  let scopes = [
    `${scopePrefix}stig-manager:stig`,
    `${scopePrefix}stig-manager:stig:read`,
    `${scopePrefix}stig-manager:collection`,
    `${scopePrefix}stig-manager:user`,
    `${scopePrefix}stig-manager:user:read`,
    `${scopePrefix}stig-manager:op`
  ]
  if (STIGMAN.Env.oauth.extraScopes) {
    scopes.push(...STIGMAN.Env.oauth.extraScopes.split(" "))
  }
  return scopes.join(" ")
}

async function loadResources() {
  for (const href of stylesheets) {
    const link = document.createElement('link')
    link.href = href
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.async = false
    if (href === 'css/dark-mode.css') {
      link.disabled = (localStorage.getItem('darkMode') !== '1')
    }
    document.head.appendChild(link)
  }
  for (const src of scripts) {
    var script = document.createElement('script')
    script.src = src
    script.async = false
    document.head.appendChild(script)
  }
  const { serializeError } = await import('./third-party/node_modules/serialize-error/index.js')
  STIGMAN.serializeError = serializeError

  STIGMAN.isMinimizedSource = isMinimizedSource
}

async function authorizeOidc() {
  window.oidcProvider = OP
  try {
    const tokens = await OP.authorize({
      oidcProvider: STIGMAN.Env.oauth.authority,
      clientId: STIGMAN.Env.oauth.clientId,
      autoRefresh: true,
      scope: getScopeStr()
    })
    if (tokens) {
      loadResources()
    }
  }
  catch (e) {
    document.getElementById("loading-text").innerHTML = e.message
  }
}

document.getElementById("loading-text").innerHTML = `Loading ${STIGMAN?.Env?.version}`
authorizeOidc()
