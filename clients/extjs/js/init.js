async function authorizeViaKeycloak() {
    var keycloak = Keycloak('js/keycloak.json');
    keycloak.onTokenExpired = function() {
        console.info('token expired at ' + keycloak.tokenParsed['exp'] + ' Date: ' + new Date(keycloak.tokenParsed['exp']*1000));
    }

    try {
        let response = await keycloak.init({ 
            onLoad: 'login-required',
            checkLoginIframe: false,
            defaultLoginOptions: {
                scope: "stig-manager"
                // ,prompt: "login"
            },
            promiseType: 'native'
        })
        window.keycloak = keycloak
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
        'js/SM/EventDispatcher.js',
        "js/Env.js",
        "js/FileUploadField.js",
        "js/overrides.js",
        "js/RowEditor.js",
        "js/RowExpander.js",
        "js/SM/SelectingGridToolbar.js",
        "js/SM/AppNavTree.js",
        "js/SM/RowEditorToolbar.js",
        "js/SM/PackageForm.js",
        "js/SM/PackageAsset.js",
        "js/SM/PackageStig.js",
        "js/packageManager.js",
        "js/stigmanUtils.js",
        "js/userProperties.js",
        "js/userAdmin.js",
        "js/assetAdmin.js",
        "js/packageManager.js",
        "js/stigAdmin.js",
        "js/artifactAdmin.js",
        "js/appDataAdmin.js",
        "js/reportTab.js",
        "js/reviewTab.js",
        "js/adminTab.js",
        "js/completionStatus.js",
        "js/findingsSummary.js",
        "js/review.js",
        "js/packageReview.js",
        "js/poamWorkspace.js",
        "js/scanManagement.js",
        "js/ExportButton.js",
        "js/jszip.min.js",
        "js/stigman.js"
    ].forEach(function(src) {
        var script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
      })
}

authorizeViaKeycloak()
