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
        loadScripts()
    }
    catch(errorData) {
        document.getElementById("loading-text").innerHTML = "Authentication Error";
    } 
}

function loadScripts() {
    [
        'ext/resources/css/ext-all.css',
        'ext/resources/css/xtheme-gray.css',
        'css/stigman.css',
        'css/font-awesome.min.css',
        'ext/ux/fileuploadfield/css/fileuploadfield.css',
        'css/RowEditor.css',
        'css/jsonview.bundle.css',
        'css/dark-mode.css'
    ].forEach(function(href) {
        var link = document.createElement('link');
        link.href = href;
        link.type = "text/css";
        link.rel = "stylesheet";
        link.async= false;
        if (href === 'css/dark-mode.css') {
            link.disabled = (localStorage.getItem('darkMode') !== '1')
        }
        document.head.appendChild(link);
      });

    [
        'ext/adapter/ext/ext-base-debug.js',
        'ext/ext-all-debug-w-comments.js',
        "ext/ux/GroupSummary.js",
        "js/chart.min.js",
        "js/stigmanUtils.js",
        'js/SM/Global.js',
        'js/BufferView.js',
        'js/SM/EventDispatcher.js',
        'js/SM/Cache.js',
        'js/SM/ServiceWorker.js',
        'js/SM/State.js',
        'js/SM/TipContent.js',
        'js/SM/Ajax.js',
        'js/SM/Warnings.js',
        'js/SM/Classification.js',
        'js/SM/MainPanel.js',
        "js/SM/WhatsNew.js",
        "js/FileUploadField.js",
        "js/MessageBox.js",
        "js/overrides.js",
        "js/RowEditor.js",
        "js/RowExpander.js",
        "js/SM/SelectingGridToolbar.js",
        "js/SM/NavTree.js",
        "js/SM/RowEditorToolbar.js",
        "js/SM/BatchReview.js",
        "js/SM/Collection.js",
        "js/SM/CollectionStig.js",
        "js/SM/CollectionForm.js",
        "js/SM/CollectionAsset.js",
        "js/SM/CollectionGrant.js",
        "js/SM/ColumnFilters.js",
        "js/SM/FindingsPanel.js",
        "js/SM/Assignments.js",
        "js/SM/asmcrypto.all.es5.js",
        "js/SM/Attachments.js",
        "js/SM/Exports.js",
        "js/SM/Parsers.js",
        "js/SM/Review.js",
        "js/SM/ReviewsImport.js",
        "js/SM/TransferAssets.js",
        "js/SM/Library.js",
        "js/SM/StigRevision.js",
        "js/SM/Metrics.js",
        "js/library.js",
        "js/userAdmin.js",
        "js/collectionAdmin.js",
        "js/collectionManager.js",
        "js/stigAdmin.js",
        "js/appDataAdmin.js",
        "js/completionStatus.js",
        "js/findingsSummary.js",
        "js/review.js",
        "js/collectionReview.js",
        "js/ExportButton.js",
        "js/jszip.min.js",
        "js/FileSaver.js",
        "js/fast-xml-parser.min.js",
        "js/jsonview.bundle.js",
        "js/stigman.js"
    ].forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
      });
}

document.getElementById("loading-text").innerHTML = `Loading ${STIGMAN?.Env?.version}`;

authorizeOidc()
