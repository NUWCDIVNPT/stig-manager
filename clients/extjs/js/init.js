async function authorizeOidc() {
    let oidcProvider = OidcProvider({
        oidcProvider: STIGMAN.Env.oauth.authority,
        clientId: STIGMAN.Env.oauth.clientId, //'0oa15s1xbhJtGfytI5d7'
        refreshDisabled: STIGMAN.Env.oauth.refreshToken.disabled
    });
    oidcProvider.refreshExpWarnCallback = function (expTs) {
        window.oidcProvider.updateToken(-1)
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
        let response = await oidcProvider.init({ 
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
        alert(errorData.error_description);
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
        'ext/adapter/ext/ext-base-debug.js',
        'ext/ext-all-debug-w-comments.js',
        "ext/ux/GroupSummary.js",
        'js/SM/Global.js',
        'js/SM/Ajax.js',
        'js/SM/Warnings.js',
        'js/SM/Classification.js',
        'js/SM/MainPanel.js',
        'js/SM/EventDispatcher.js',
        "js/FileUploadField.js",
        "js/overrides.js",
        "js/RowEditor.js",
        "js/RowExpander.js",
        "js/SM/SelectingGridToolbar.js",
        "js/SM/NavTree.js",
        "js/SM/RowEditorToolbar.js",
        "js/SM/Collection.js",
        "js/SM/CollectionForm.js",
        "js/SM/CollectionAsset.js",
        "js/SM/CollectionStig.js",
        "js/SM/CollectionGrant.js",
        "js/SM/FindingsPanel.js",
        "js/SM/Assignments.js",
        "js/SM/asmcrypto.all.es5.js",
        "js/SM/Attachments.js",
        "js/SM/Exports.js",
        "js/SM/Parsers.js",
        "js/SM/ReviewsImport.js",
        "js/SM/TransferAssets.js",
        "js/collectionManager.js",
        "js/stigmanUtils.js",
        "js/userProperties.js",
        "js/userAdmin.js",
        "js/collectionAdmin.js",
        "js/assetAdmin.js",
        "js/collectionManager.js",
        "js/stigAdmin.js",
        "js/artifactAdmin.js",
        "js/appDataAdmin.js",
        "js/adminTab.js",
        "js/completionStatus.js",
        "js/findingsSummary.js",
        "js/review.js",
        "js/collectionReview.js",
        "js/poamWorkspace.js",
        "js/scanManagement.js",
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

authorizeOidc()
