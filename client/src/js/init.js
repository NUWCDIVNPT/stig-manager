import { stylesheets, scripts, isMinimizedSource } from './resources.js'
import * as OP from './modules/oidcProvider.js'
window.oidcProvider = OP

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
    const script = document.createElement('script')
    script.src = src
    script.async = false
    document.head.appendChild(script)
  }
  const { serializeError } = await import('./modules/node_modules/serialize-error/index.js')
  STIGMAN.serializeError = serializeError
  STIGMAN.ClientModules = await import('./modules/node_modules/@nuwcdivnpt/stig-manager-client-modules/index.js')

  STIGMAN.isMinimizedSource = isMinimizedSource
}

async function authorizeOidc() {
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

if (window.isSecureContext) {
  document.getElementById("loading-text").innerHTML = `Loading ${STIGMAN?.Env?.version}`
  authorizeOidc()
}
else {
  document.getElementById("loading-text").innerHTML = `SECURE CONTEXT REQUIRED<br><br>The App is not executing in a <a href=https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts target="_blank">secure context</a> and cannot continue. <br><br>To be considered secure, resources that are not local must be served over https:// URLs and the security properties of the network channel used to deliver the resource must not be considered deprecated.`
}

