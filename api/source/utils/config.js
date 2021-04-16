const package = require("../package.json")

if (process.env.STIGMAN_JWT_ROLES_CLAIM) {
    const roleChain = process.env.STIGMAN_JWT_ROLES_CLAIM.split('.')
    for (let x=0; x < roleChain.length; x++) {
        roleChain[x] = `['${roleChain[x]}']`
    }
    process.env.STIGMAN_JWT_ROLES_CLAIM = roleChain.join('?.')
}

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
        lastAccessResolution: 60
    },
    client: {
        disabled: process.env.STIGMAN_CLIENT_DISABLED === "true",
        directory: process.env.STIGMAN_CLIENT_DIRECTORY || "./client"
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
        service: process.env.STIGMAN_DB_SERVICE || "orclpdb1.localdomain",
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
        authority: process.env.STIGMAN_SWAGGER_AUTHORITY || "http://localhost:8080/auth/realms/stigman", 
        server: process.env.STIGMAN_SWAGGER_SERVER || "http://localhost:54000/api",
        oauth2RedirectUrl: process.env.STIGMAN_SWAGGER_REDIRECT || "http://localhost:54000/api-docs/oauth2-redirect.html"
    },
    oauth: {
        authority: process.env.STIGMAN_API_AUTHORITY || "http://localhost:8080/auth/realms/stigman",
        claims: {
            username: process.env.STIGMAN_JWT_USERNAME_CLAIM || "preferred_username",
            servicename: process.env.STIGMAN_JWT_SERVICENAME_CLAIM || "clientId",
            name: process.env.STIGMAN_JWT_NAME_CLAIM || "name",
            roles: process.env.STIGMAN_JWT_ROLES_CLAIM || "realm_access.roles",
            email: process.env.STIGMAN_JWT_EMAIL_CLAIM || "email"
        }
    }
}

module.exports = config