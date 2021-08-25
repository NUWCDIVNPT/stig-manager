const package = require("../package.json")

// Start handling of deprecated envvars
let legacyClientKeycloakAuthority
if (process.env.STIGMAN_CLIENT_KEYCLOAK_AUTH || process.env.STIGMAN_CLIENT_KEYCLOAK_REALM) {
    if (process.env.STIGMAN_CLIENT_KEYCLOAK_AUTH) {
        console.log('[WARN] Envvar STIGMAN_CLIENT_KEYCLOAK_AUTH is deprecated and will be removed soon. Please use STIGMAN_CLIENT_OIDC_PROVIDER or STIGMAN_OIDC_PROVIDER.')
        legacyClientKeycloakAuthority = `${process.env.STIGMAN_CLIENT_KEYCLOAK_AUTH}/realms/`
    }
    else {
        legacyClientKeycloakAuthority = 'http://localhost:8080/auth/realms/'
    }
    if (process.env.STIGMAN_CLIENT_KEYCLOAK_REALM) {
        console.log('[WARN] Envvar STIGMAN_CLIENT_KEYCLOAK_REALM is deprecated and will be removed soon. Please use STIGMAN_CLIENT_OIDC_PROVIDER or STIGMAN_OIDC_PROVIDER.')
        legacyClientKeycloakAuthority += process.env.STIGMAN_CLIENT_KEYCLOAK_REALM
    }
    else {
        legacyClientKeycloakAuthority += 'stigman'
    }
}
let legacyClientKeycloakClientId
if (process.env.STIGMAN_CLIENT_KEYCLOAK_CLIENTID) {
    console.log('[WARN] Envvar STIGMAN_CLIENT_KEYCLOAK_CLIENTID is deprecated and will be removed soon. Please use STIGMAN_CLIENT_ID.')
    legacyClientKeycloakClientId = process.env.STIGMAN_CLIENT_KEYCLOAK_CLIENTID
}
if (process.env.STIGMAN_JWT_ROLES_CLAIM) {
    console.log('[WARN] Envvar STIGMAN_JWT_ROLES_CLAIM is deprecated and will be removed soon. Please use STIGMAN_JWT_PRIVILEGES_CLAIM.')
}
if (process.env.STIGMAN_API_AUTHORITY) {
    console.log('[WARN] Envvar STIGMAN_API_AUTHORITY is deprecated and will be removed soon. Please use STIGMAN_OIDC_PROVIDER.')
}
if (process.env.STIGMAN_SWAGGER_AUTHORITY) {
    console.log('[WARN] Envvar STIGMAN_SWAGGER_AUTHORITY is deprecated and will be removed soon. Please use STIGMAN_SWAGGER_OIDC_PROVIDER.')
}
// End handling of deprecated envvars

let config = {
    version: package.version,
    commit: {
        branch: process.env.COMMIT_BRANCH || 'na',
        sha: process.env.COMMIT_SHA || 'na',
        tag: process.env.COMMIT_TAG || 'na',
        describe: process.env.COMMIT_DESCRIBE || 'na'
    },
    settings: {
        setClassification: process.env.STIGMAN_CLASSIFICATION,
        lastAccessResolution: 60,
        // Supported STIGMAN_DEV_RESPONSE_VALIDATION values: 
        // "logOnly" (logs failing response, but still sends them) 
        // "none"(no validation performed)
        responseValidation: process.env.STIGMAN_DEV_RESPONSE_VALIDATION || "none"

    },
    client: {
        clientId: process.env.STIGMAN_CLIENT_ID || legacyClientKeycloakClientId || "stig-manager",
        authority: process.env.STIGMAN_CLIENT_OIDC_PROVIDER || legacyClientKeycloakAuthority || process.env.STIGMAN_OIDC_PROVIDER || "http://localhost:8080/auth/realms/stigman",
        apiBase: process.env.STIGMAN_CLIENT_API_BASE || "api",
        disabled: process.env.STIGMAN_CLIENT_DISABLED === "true",
        directory: process.env.STIGMAN_CLIENT_DIRECTORY || "./client",
        extraScopes: process.env.STIGMAN_CLIENT_EXTRA_SCOPES,
        refreshToken: {
            disabled: process.env.STIGMAN_CLIENT_REFRESH_DISABLED ? process.env.STIGMAN_CLIENT_REFRESH_DISABLED === "true" : false,
        }
    },
    docs: {
        disabled: process.env.STIGMAN_DOCS_DISABLED  === "true",
        docsDirectory: process.env.STIGMAN_DOCS_DIRECTORY || "./docs",
    },    
    http: {
        address: process.env.STIGMAN_API_ADDRESS || "0.0.0.0",
        port: process.env.STIGMAN_API_PORT || 54000,
        maxJsonBody: process.env.STIGMAN_API_MAX_JSON_BODY || "5242880",
        maxUpload: process.env.STIGMAN_API_MAX_UPLOAD || "1073741824"
    },
    database: {
        type: process.env.STIGMAN_DB_TYPE || "mysql",
        host: process.env.STIGMAN_DB_HOST || "localhost",
        port: process.env.STIGMAN_DB_PORT || 3306,
        schema: process.env.STIGMAN_DB_SCHEMA || "stigman",
        username: process.env.STIGMAN_DB_USER || "stigman",
        password: process.env.STIGMAN_DB_PASSWORD,
        maxConnections: process.env.STIGMAN_DB_MAX_CONNECTIONS || 25,
        tls: {
            ca_file: process.env.STIGMAN_DB_TLS_CA_FILE,
            cert_file: process.env.STIGMAN_DB_TLS_CERT_FILE,
            key_file: process.env.STIGMAN_DB_TLS_KEY_FILE
        },
        revert: process.env.STIGMAN_DB_REVERT === "true"
    },
    init: {
        importStigs: process.env.STIGMAN_INIT_IMPORT_STIGS === "true",
        importScap: process.env.STIGMAN_INIT_IMPORT_SCAP === "true"
    },
    swaggerUi: {
        enabled: process.env.STIGMAN_SWAGGER_ENABLED === "true", 
        authority: process.env.STIGMAN_SWAGGER_OIDC_PROVIDER || process.env.STIGMAN_SWAGGER_AUTHORITY || process.env.STIGMAN_OIDC_PROVIDER || "http://localhost:8080/auth/realms/stigman", 
        server: process.env.STIGMAN_SWAGGER_SERVER || "http://localhost:54000/api",
        oauth2RedirectUrl: process.env.STIGMAN_SWAGGER_REDIRECT || "http://localhost:54000/api-docs/oauth2-redirect.html"
    },
    oauth: {
        authority: process.env.STIGMAN_OIDC_PROVIDER || process.env.STIGMAN_API_AUTHORITY || "http://localhost:8080/auth/realms/stigman",
        claims: {
            scope: process.env.STIGMAN_JWT_SCOPE_CLAIM || "scope",
            scopeFormat: process.env.STIGMAN_JWT_SCOPE_FORMAT || "rfc",
            username: process.env.STIGMAN_JWT_USERNAME_CLAIM || "preferred_username",
            servicename: process.env.STIGMAN_JWT_SERVICENAME_CLAIM || "clientId",
            name: process.env.STIGMAN_JWT_NAME_CLAIM || process.env.STIGMAN_JWT_USERNAME_CLAIM || "name",
            privileges: formatChain(process.env.STIGMAN_JWT_PRIVILEGES_CLAIM || process.env.STIGMAN_JWT_ROLES_CLAIM || "realm_access.roles"),
            email: process.env.STIGMAN_JWT_EMAIL_CLAIM || "email"
        }
    }
}

function formatChain(path) {
    const components = path?.split('.')
    if (!components?.length) return path
    for (let x=0; x < components.length; x++) {
      components[x] = `['${components[x]}']`
    }
    return components.join('?.')
  }
  
module.exports = config