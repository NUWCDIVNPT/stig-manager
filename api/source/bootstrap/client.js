const express = require('express')
const path = require('path')
const writer = require('../utils/writer')
const logger = require('../utils/logger')
const config = require('../utils/config')

function serveClient(app) {

    if (config.client.disabled) {
        logger.writeDebug('serveClient', 'client', {message: 'client disabled'})
        return
    }
    try {
        serveClientEnv(app)
        serveClientV2Env(app)
        serveStaticFiles(app)
        logger.writeDebug('serveClient', 'client', { message: 'succeeded setting up client' })
    }
    catch (err) {
        logger.writeError('serveClient', 'client', {message: err.message, stack: err.stack})
    }
}

function getClientEnv(){
    const envJS = 
    `const STIGMAN = {
        Env: {
            version: "${config.version}",
            apiBase: "${config.client.apiBase}",
            displayAppManagers: ${config.client.displayAppManagers},
            stateEvents: ${config.client.stateEvents},
            welcome: {
                image: "${config.client.welcome.image}",
                title: "${config.client.welcome.title.replace(/"/g, '\\"')}",
                message: "${config.client.welcome.message.replace(/"/g, '\\"')}",
                link: "${config.client.welcome.link}"
            },
            commit: {
                branch: "${config.commit.branch}",
                sha: "${config.commit.sha}",
                tag: "${config.commit.tag}",
                describe: "${config.commit.describe}"
            },
            oauth: {
                authority:  "${config.client.authority}",
                clientId: "${config.client.clientId}",
                extraScopes: "${config.client.extraScopes ?? ''}",
                scopePrefix: "${config.client.scopePrefix ?? ''}",
                responseMode: "${config.client.responseMode}",
                reauthAction: "${config.client.reauthAction}",
                strictPkce: ${config.client.strictPkce},
                audienceValue: "${config.oauth.audienceValue ?? ''}",
                claims: ${JSON.stringify(config.oauth.claims)},
                idleTimeoutUser: ${config.client.idleTimeoutUser},
                idleTimeoutAdmin: ${config.client.idleTimeoutAdmin},
            },
            experimental: {
                appData: "${config.experimental.appData}",
                logStream: "${config.experimental.logStream}"
            }
        }   
    }`
    return envJS
}

function getClientV2Env(){
    // atm, this is the same as client V1 except for apiBase being ../api
    const envJS = 
    `const STIGMAN = {
        Env: {
            version: "${config.version}",
            apiBase: "../api",
            displayAppManagers: ${config.client.displayAppManagers},
            stateEvents: ${config.client.stateEvents},
            welcome: {
                image: "${config.client.welcome.image}",
                title: "${config.client.welcome.title.replace(/"/g, '\\"')}",
                message: "${config.client.welcome.message.replace(/"/g, '\\"')}",
                link: "${config.client.welcome.link}"
            },
            commit: {
                branch: "${config.commit.branch}",
                sha: "${config.commit.sha}",
                tag: "${config.commit.tag}",
                describe: "${config.commit.describe}"
            },
            oauth: {
                authority:  "${config.client.authority}",
                clientId: "${config.client.clientId}",
                extraScopes: "${config.client.extraScopes ?? ''}",
                scopePrefix: "${config.client.scopePrefix ?? ''}",
                responseMode: "${config.client.responseMode}",
                reauthAction: "${config.client.reauthAction}",
                strictPkce: ${config.client.strictPkce},
                audienceValue: "${config.oauth.audienceValue ?? ''}",
                claims: ${JSON.stringify(config.oauth.claims)},
                idleTimeoutUser: ${config.client.idleTimeoutUser},
                idleTimeoutAdmin: ${config.client.idleTimeoutAdmin},
            },
            experimental: {
                appData: "${config.experimental.appData}",
                logStream: "${config.experimental.logStream}"
            }
        }   
    }`
    return envJS
}


function serveClientEnv(app){
    const envJS = getClientEnv()
    app.get('/js/Env.js', function (req, res) {
        req.component = 'static'
        writer.writeWithContentType(res, { payload: envJS, contentType: "application/javascript" })
    })
}
function serveClientV2Env(app){
    const envJS = getClientV2Env()
    app.get('/client-v2/Env.js', function (req, res) {
        req.component = 'static'
        writer.writeWithContentType(res, { payload: envJS, contentType: "application/javascript" })
    })
}

function serveStaticFiles(app){
    const staticPath = path.join(__dirname, "../",  config.client.directory)
    logger.writeDebug('serveStaticFiles', 'client', {client_static: staticPath})
    const expressStatic = express.static(staticPath)

    app.use('/', (req, res, next) => {
        req.component = 'static'
        expressStatic(req, res, next)
    })

    const clientV2Path = path.join(__dirname, "../", config.client.next_directory)
    logger.writeInfo('serveStaticFiles', 'clientV2', {clientV2_static: clientV2Path})
    const expressNextStatic = express.static(clientV2Path)

    app.use('/client-v2', (req, res, next) => {
        req.component = 'static'
        expressNextStatic(req, res, next)
    })
}

module.exports = {
    serveClient,
}
