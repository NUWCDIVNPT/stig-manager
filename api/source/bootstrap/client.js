const express = require('express')
const path = require('node:path')
const writer = require('../utils/writer')
const logger = require('../utils/logger')
const config = require('../utils/config')
const history = require('connect-history-api-fallback');
const fs = require('node:fs')

function serveClient(app) {

    if (config.client.disabled) {
        logger.writeDebug('serveClient', 'client', {message: 'client disabled'})
        return
    }
    try {
        serveClientEnv(app)
        serveClientV2Env(app)
        serveStaticFiles(app)
        serveStaticV2Files(app)
        logger.writeDebug('serveClient', 'client', { message: 'succeeded setting up clients' })
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
    const envJS = 
    `const STIGMAN = {
        Env: {
            version: "${config.version}",
            apiBase: "${config.client.apiBase}",
            historyBase: "${config.client.historyBase}",
            pathPrefix: "${config.client.pathPrefix}",
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
        if (req.originalUrl.startsWith('/client-v2')){
            next()
            return
        }
        req.component = 'static'
        expressStatic(req, res, next)
    })
}

function serveStaticV2Files(app){
    const staticPath = path.join(__dirname, "../",  config.client.next_directory)
    const indexPath = path.join(staticPath, 'index.html')
    logger.writeInfo('serveStaticV2Files', 'client', {clientV2_static: staticPath})
    
    let indexTemplate = null
    
    // Read index.html template once at startup
    try {
        indexTemplate = fs.readFileSync(indexPath, 'utf8')
    } catch (err) {
        logger.writeError('serveStaticV2Files', 'client', {message: 'Failed to read index.html', error: err.message})
    }
    
    const expressStatic = express.static(staticPath)

    // app.use(history())
    
    // Intercept index.html requests to inject base path
    app.use('/client-v2', (req, res, next) => {
        req.component = 'static'
        
        if (config.client.pathPrefix && (req.path === '/' || req.path === '/index.html' || !path.extname(req.path))) {
            // Change below when nextgen client is served from root instead of /client-v2
            const injectedHtml = indexTemplate.replace('<head>', `<head>\n    <base href="${config.client.pathPrefix}client-v2/">`)
            res.setHeader('Content-Type', 'text/html')
            res.send(injectedHtml)
        } else {
            expressStatic(req, res, next)
        }
    })
}

module.exports = {
    serveClient,
}
