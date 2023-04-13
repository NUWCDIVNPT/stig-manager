import { stylesheets, scripts, isMinimizedSource } from './resources.js'

async function authorizeOidc() {
    let oidcProvider = OidcProvider({
        oidcProvider: STIGMAN.Env.oauth.authority,
        clientId: STIGMAN.Env.oauth.clientId
    })
    oidcProvider.updateCallback = async function () {
        try {
            await window.oidcProvider.updateToken(-1)
        }
        catch (e) {
            console.log('[OIDCPROVIDER] Error in updateCallback')
        } 
    }
    oidcProvider.onTokenExpired = function() {
        console.info(`[OIDCPROVIDER] Token expired at ${new Date(oidcProvider.tokenParsed.exp * 1000)}`)
    }
    function scheduleUpdateCallback() {
        if (oidcProvider.refreshToken && !STIGMAN.Env.oauth.refreshToken.disabled) {
            const now = new Date().getTime()
            const expiration = oidcProvider.refreshTokenParsed ? oidcProvider.refreshTokenParsed.exp : oidcProvider.tokenParsed.exp
            const updateDelay = (expiration - 60 - (now / 1000) + oidcProvider.timeSkew) * 1000;
            if (oidcProvider.updateTid) {
                clearTimeout(oidcProvider.updateTid)
            }
            oidcProvider.updateTid = setTimeout(oidcProvider.updateCallback, updateDelay)
            console.info(`[OIDCPROVIDER] Scheduled token refresh at ${new Date(now + updateDelay)}`)
        }
    }
    oidcProvider.onAuthSuccess = scheduleUpdateCallback
    oidcProvider.onAuthRefreshSuccess = scheduleUpdateCallback
    
    try {
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
        window.oidcProvider = oidcProvider
        await oidcProvider.init({ 
            onLoad: 'login-required',
            checkLoginIframe: false,
            pkceMethod: 'S256',
            defaultLoginOptions: {
                scope: scopes.join(" ")
            },
            enableLogging: true
        })
        await loadResources()
    }
    catch(errorData) {
        document.getElementById("loading-text").innerHTML = `Authentication Error<br>${errorData}`;
    } 
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
  
document.getElementById("loading-text").innerHTML = `Loading ${STIGMAN?.Env?.version}`;

authorizeOidc()
