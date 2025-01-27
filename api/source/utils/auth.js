const config = require('./config')
const logger = require('./logger')
const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const retry = require('async-retry')
const _ = require('lodash')
const {promisify} = require('util')
const UserService = require(`../service/UserService`)
const axios = require('axios')
const SmError = require('./error')

let jwksUri
let client

const privilegeGetter = new Function("obj", "return obj?." + config.oauth.claims.privileges + " || [];");

const verifyRequest = async function (req, requiredScopes, securityDefinition) {
    const token = getBearerToken(req)
    if (!token) {
        throw(new SmError.AuthorizeError("OIDC bearer token must be provided"))
    }
    
    const decoded = await verifyAndDecodeToken (token, getKey, {algorithms: ['RS256']})
    req.access_token = decoded
    req.bearer = token

    // Get username from configured claims in token, or fall back through precedence list. 
    const usernamePrecedence = [config.oauth.claims.username, "preferred_username", config.oauth.claims.servicename, "azp", "client_id", "clientId"]
    const username = decoded[usernamePrecedence.find(element => !!decoded[element])]
    // If no username found, throw Privilege error
    if (username === undefined) {
        throw(new SmError.PrivilegeError("No token claim mappable to username found"))
    }

    // Check scopes
    const grantedScopes = typeof decoded[config.oauth.claims.scope] === 'string' ? 
        decoded[config.oauth.claims.scope].split(' ') : 
        decoded[config.oauth.claims.scope]
    const commonScopes = _.intersectionWith(grantedScopes, requiredScopes, function(gs,rs) {
        if (gs === rs) return gs
        let gsTokens = gs.split(":").filter(i => i.length)
        let rsTokens = rs.split(":").filter(i => i.length)
        if (gsTokens.length === 0) {
            return false
        }
        else {
            return gsTokens.every((t, i) => rsTokens[i] === t)
        }
    })
    if (commonScopes.length == 0) {
        throw(new SmError.PrivilegeError("Not in scope"))
    }

    // Get privileges and check elevate param  
    const privileges = {
        create_collection: privilegeGetter(decoded).includes('create_collection'),
        admin: privilegeGetter(decoded).includes('admin')
    }
    if ('elevate' in req.query && (req.query.elevate === 'true' && !privileges.admin)) {
        throw(new SmError.PrivilegeError("User has insufficient privilege to complete this request."))
    }

    const userObject = await UserService.getUserObject(username) ?? {username} 
    
    const refreshFields = {}
    let now = new Date().toUTCString()
    now = new Date(now).getTime()
    now = now / 1000 | 0 //https://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number

    if (!userObject?.lastAccess || now - userObject?.lastAccess >= config.settings.lastAccessResolution) {
        refreshFields.lastAccess = now
    }
    if (!userObject?.lastClaims || decoded[config.oauth.claims.assertion] !== userObject?.lastClaims?.[config.oauth.claims.assertion]) {
        refreshFields.lastClaims = JSON.stringify(decoded)
    }
    if (refreshFields.lastAccess || refreshFields.lastClaims) {
        const userId = await UserService.setUserData(userObject, refreshFields)
        if (userId != userObject.userId) {
            userObject.userId = userId.toString()
        }
    }

    userObject.privileges = privileges
    req.userObject = userObject
    return true
}

const verifyAndDecodeToken = promisify(jwt.verify)

const getBearerToken = req => {
    if (!req.headers.authorization) return
    const headerParts = req.headers.authorization.split(' ')
    if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1]
}

function getKey(header, callback){
    client.getSigningKey(header.kid, function(err, key) {
        if (!err) {
            let signingKey = key.publicKey || key.rsaPublicKey
            callback(null, signingKey)
        } else {
            callback(err, null)
        }
    })
}

let initAttempt = 0
async function initializeAuth(depStatus) {
    const retries = 24
    const wellKnown = `${config.oauth.authority}/.well-known/openid-configuration`
    async function getJwks() {
        logger.writeDebug('oidc', 'discovery', { metadataUri: wellKnown, attempt: ++initAttempt })

        const openidConfig = (await axios.get(wellKnown)).data

        logger.writeDebug('oidc', 'discovery', { metadataUri: wellKnown, metadata: openidConfig})
        if (!openidConfig.jwks_uri) {
            throw( new Error('No jwks_uri property found') )
        }
        jwksUri = openidConfig.jwks_uri
        client = jwksClient({
            jwksUri: jwksUri
        })
    }
    await retry ( getJwks, {
        retries,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
        onRetry: (error) => {
            logger.writeError('oidc', 'discovery', { success: false, metadataUri: wellKnown, message: error.message })
        }
    })
    logger.writeInfo('oidc', 'discovery', { success: true, metadataUri: wellKnown, jwksUri: jwksUri })
    depStatus.auth = 'up'
}

module.exports = {verifyRequest, initializeAuth, privilegeGetter}
