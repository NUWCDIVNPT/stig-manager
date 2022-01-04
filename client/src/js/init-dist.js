async function authorizeOidc() {
    let oidcProvider = OidcProvider({
        oidcProvider: STIGMAN.Env.oauth.authority,
        clientId: STIGMAN.Env.oauth.clientId, //'0oa15s1xbhJtGfytI5d7'
        refreshDisabled: STIGMAN.Env.oauth.refreshToken.disabled
    });
    oidcProvider.refreshExpWarnCallback = async function (expTs) {
        try {
            await window.oidcProvider.updateToken(-1)
        }
        catch (e) {
            console.log('[OIDCPROVIDER] Error in refreshExpWarnCallback')
        } 
    }
    oidcProvider.onTokenExpired = function() {
        console.info('[OIDCPROVIDER] Token expired at ' + new Date(oidcProvider.tokenParsed['exp']*1000));
    }
    oidcProvider.onAuthSuccess = function() {
        if (oidcProvider.refreshTokenParsed) {
            let refreshExpDate = new Date(oidcProvider.refreshTokenParsed.exp * 1000)
            let refreshExpWarnDelay = (oidcProvider.refreshTokenParsed.exp - 60 - (new Date().getTime() / 1000) + oidcProvider.timeSkew) * 1000;
            if (oidcProvider.refreshExpWarnTid) {
                clearTimeout(oidcProvider.refreshExpWarnTid)
            }
            oidcProvider.refreshExpWarnTid = setTimeout(oidcProvider.refreshExpWarnCallback, refreshExpWarnDelay, oidcProvider.refreshTokenParsed.exp)
            console.info(`[OIDCPROVIDER] authSuccess: refresh expires ${refreshExpDate}`)
        }
    }
    oidcProvider.onAuthRefreshSuccess = function() {
        if (oidcProvider.refreshTokenParsed) {
            let refreshExpDate = new Date(oidcProvider.refreshTokenParsed.exp * 1000)
            let refreshExpWarnDelay = (oidcProvider.refreshTokenParsed.exp - 60 - (new Date().getTime() / 1000) + oidcProvider.timeSkew) * 1000
            if (oidcProvider.refreshExpWarnTid) {
                clearTimeout(oidcProvider.refreshExpWarnTid)
            }
            oidcProvider.refreshExpWarnTid = setTimeout(oidcProvider.refreshExpWarnCallback, refreshExpWarnDelay, oidcProvider.refreshTokenParsed.exp)
            console.info(`[OIDCPROVIDER] authRefreshSuccess: refresh expires ${refreshExpDate}`)
        }
    }
    
    try {
        let scopes = [
            "stig-manager:stig",
            "stig-manager:stig:read",
            "stig-manager:collection",
            "stig-manager:user",
            "stig-manager:user:read",
            "stig-manager:op"
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
        loadResources()
    }
    catch(errorData) {
        document.getElementById("loading-text").innerHTML = "Authentication Error";
    } 
}

function loadResources() {
    [
        'ext/resources/css/ext-all.css',
        'ext/resources/css/xtheme-gray.css',
        'css/stigman.css',
        'css/font-awesome.min.css',
        'ext/ux/fileuploadfield/css/fileuploadfield.css',
        'css/RowEditor.css',
        'css/jsonview.bundle.css'
    ].forEach(function(href) {
        var link = document.createElement('link');
        link.href = href;
        link.type = "text/css";
        link.rel = "stylesheet";
        link.async= false;
        document.head.appendChild(link);
      });

    [
        'ext/adapter/ext/ext-base.js',
        'ext/ext-all.js',
        'ext/ux/GroupSummary.js',
        "js/stig-manager.min.js"
    ].forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
      });
}

document.getElementById("loading-text").innerHTML = `Loading ${STIGMAN?.Env?.version}`;

authorizeOidc()
