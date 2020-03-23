let config = {
    "http": {
        "address": process.env.STIGMAN_API_ADDRESS || "0.0.0.0",
        "port": process.env.STIGMAN_API_PORT || 54000
    },
    "database": {
        "type": process.env.STIGMAN_DB_TYPE || "oracle",
        "host": process.env.STIGMAN_DB_HOST || "db",
        "port": process.env.STIGMAN_DB_PORT || 1521,
        "service": process.env.STIGMAN_DB_SERVICE || "orclpdb1.localdomain",
        "username": process.env.STIGMAN_DB_USER || "stigman",
        "password": process.env.STIGMAN_DB_PASSWORD || "stigman"
    },
    "swaggerUi": {
        "enabled": process.env.STIGMAN_SWAGGER_ENABLED || false, 
        "server": process.env.STIGMAN_SWAGGER_SERVER || "http://localhost:54000/stig-manager/api",
        "oauth2RedirectUrl": process.env.STIGMAN_SWAGGER_REDIRECT || "http://localhost:54000/api-docs/oauth2-redirect.html"
    },
    "oauth": {
        "authority": process.env.STIGMAN_API_AUTHORITY || "http://localhost:8080/auth/realms/stigman",
        "userid_claim": process.env.STIGMAN_JWT_USER_CLAIM || "preferred_username",
        "groups_claim": process.env.STIGMAN_JWT_GROUPS_CLAIM || "groups"
    }
}

module.exports = config