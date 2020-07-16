let config = {
    version: '1.0.0-beta',
    commit: {
        branch: process.env.COMMIT_BRANCH || 'na',
        sha: process.env.COMMIT_SHA || 'na',
        tag: process.env.COMMIT_TAG || 'na',
        describe: process.env.COMMIT_DESCRIBE || 'na'
    },
    settings: {
        setClassification: process.env.STIGMAN_CLASSIFICATION,
        lastAccessResolution: 60,
        autoEnrollUser: process.env.STIGMAN_API_AUTO_ENROLL || "false"
    },
    client: {
        enabled: process.env.STIGMAN_CLIENT_ENABLED || "true",
        directory: process.env.STIGMAN_CLIENT_DIRECTORY || "./client"
    },
    http: {
        address: process.env.STIGMAN_API_ADDRESS || "0.0.0.0",
        port: process.env.STIGMAN_API_PORT || 54000
    },
    database: {
        type: process.env.STIGMAN_DB_TYPE || "mysql",
        host: process.env.STIGMAN_DB_HOST || "localhost",
        port: process.env.STIGMAN_DB_PORT || 3306,
        service: process.env.STIGMAN_DB_SERVICE || "orclpdb1.localdomain",
        schema: process.env.STIGMAN_DB_SCHEMA || "stigman",
        username: process.env.STIGMAN_DB_USER || "stigman",
        password: process.env.STIGMAN_DB_PASSWORD || "stigman"
    },
    init: {
        superuser: process.env.STIGMAN_SUPERUSER || 'admin',
        importStigs: process.env.STIGMAN_API_IMPORT_STIGS || 'false',
        importScap: process.env.STIGMAN_API_IMPORT_SCAP || 'false'
    },
    swaggerUi: {
        enabled: process.env.STIGMAN_SWAGGER_ENABLED || "true", 
        authority: process.env.STIGMAN_SWAGGER_AUTHORITY || "http://localhost:8080/auth/realms/stigman", 
        server: process.env.STIGMAN_SWAGGER_SERVER || "http://localhost:54000/api",
        oauth2RedirectUrl: process.env.STIGMAN_SWAGGER_REDIRECT || "http://localhost:54000/api-docs/oauth2-redirect.html"
    },
    oauth: {
        authority: process.env.STIGMAN_API_AUTHORITY || "http://localhost:8080/auth/realms/stigman",
        userid_claim: process.env.STIGMAN_JWT_USER_CLAIM || "preferred_username",
        groups_claim: process.env.STIGMAN_JWT_GROUPS_CLAIM || "groups"
    }
}

if (!config.commit.branch) {
    
}

module.exports = config