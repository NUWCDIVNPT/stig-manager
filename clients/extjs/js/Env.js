Ext.ns('STIGMAN')

STIGMAN.Env = {
    version: "1.0.0-beta.21" || "1",
    apiBase: "/api" || "../api",
    commit: {
        branch: "" || "na",
        sha: "" || "na",
        tag: "" || "na",
        describe: "" || "na"
    },
    oauth: {
        claims: {
            username: "" || "preferred_username",
            servicename: "" || "clientId",
            name: "" || "name",
            roles: "" || "realm_access?.roles",
            email: "" || "email"
        }
    }
}
