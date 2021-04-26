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
            onLoad: 'login-required',
            pkceMethod: 'S256',
            defaultLoginOptions: {
                scope: "stig-manager:stig stig-manager:stig:read stig-manager:collection stig-manager:user stig-manager:user:read stig-manager:op"
                // ,prompt: "login"
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
        "js/Env.js",
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
        "js/SM/Exports.js",
        "js/SM/Parsers.js",
        "js/SM/ReviewsImport.js",
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

authorizeViaKeycloak()
