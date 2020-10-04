async function authorizeViaKeycloak() {
    let keycloak = Keycloak('js/keycloak.json');
    keycloak.refreshExpWarnCallback = function (expTs) {
       keycloak.onRefreshExpWarn && keycloak.onRefreshExpWarn(expTs)
    }
    keycloak.onTokenExpired = function() {
        console.info('token expired at ' + keycloak.tokenParsed['exp'] + ' Date: ' + new Date(keycloak.tokenParsed['exp']*1000));
    }
    keycloak.onAuthSuccess = function() {
        let refreshExpDate = new Date(keycloak.refreshTokenParsed.exp * 1000)
        let refreshExpWarnDelay = (keycloak.refreshTokenParsed.exp - 60 - (new Date().getTime() / 1000) + keycloak.timeSkew) * 1000;
         window.keycloak.refreshTokenParsed.exp - 60
        if (keycloak.refreshExpWarnTid) {
            clearTimeout(keycloak.refreshExpWarnTid)
        }
        keycloak.refreshExpWarnTid = setTimeout(keycloak.refreshExpWarnCallback, refreshExpWarnDelay, keycloak.refreshTokenParsed.exp)
        console.info(`authSuccess: refresh expires ${refreshExpDate}`)
    }
    keycloak.onAuthRefreshSuccess = function() {
        let refreshExpDate = new Date(keycloak.refreshTokenParsed.exp * 1000)
        let refreshExpWarnDelay = (keycloak.refreshTokenParsed.exp - 60 - (new Date().getTime() / 1000) + keycloak.timeSkew) * 1000
         window.keycloak.refreshTokenParsed.exp - 60
        if (keycloak.refreshExpWarnTid) {
            clearTimeout(keycloak.refreshExpWarnTid)
        }
        keycloak.refreshExpWarnTid = setTimeout(keycloak.refreshExpWarnCallback, refreshExpWarnDelay, keycloak.refreshTokenParsed.exp)
        console.info(`authRefreshSuccess: refresh expires ${refreshExpDate}`)
    }
   

    try {
        window.keycloak = keycloak
        let response = await keycloak.init({ 
            // flow: 'implicit',
            onLoad: 'login-required',
            // onLoad: 'check-sso',
            // checkLoginIframe: true,
            defaultLoginOptions: {
                scope: "stig-manager"
                // ,prompt: "login"
            },
            enableLogging: true
        })
        loadScripts()
    }
    catch(errorData) {
        alert(errorData);
    } 
}

function loadScripts() {
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
        "js/Env.js",
        "js/FileUploadField.js",
        "js/overrides.js",
        "js/RowEditor.js",
        "js/RowExpander.js",
        "js/SM/SelectingGridToolbar.js",
        "js/SM/NavTree.js",
        "js/SM/RowEditorToolbar.js",
        "js/SM/CollectionForm.js",
        "js/SM/CollectionAsset.js",
        "js/SM/CollectionStig.js",
        "js/SM/CollectionGrant.js",
        "js/SM/FindingsPanel.js",
        "js/SM/Assignments.js",
        "js/SM/Parsers.js",
        "js/SM/ReviewImport.js",
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
        "js/reportTab.js",
        "js/reviewTab.js",
        "js/adminTab.js",
        "js/completionStatus.js",
        "js/findingsSummary.js",
        "js/review.js",
        "js/collectionReview.js",
        "js/poamWorkspace.js",
        "js/scanManagement.js",
        "js/ExportButton.js",
        "js/jszip.min.js",
        "js/fast-xml-parser.min.js",
        "js/stigman.js"
    ].forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
      })
}

authorizeViaKeycloak()
