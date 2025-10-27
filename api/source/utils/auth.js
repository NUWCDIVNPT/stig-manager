const config = require('./config')
const logger = require('./logger')
const jwt = require('jsonwebtoken')
const retry = require('async-retry')
const _ = require('lodash')
const UserService = require(`../service/UserService`)
const SmError = require('./error')
const state = require('./state')
const JWKSCache = require('./jwksCache')

let jwksCache

// Helper function to safely traverse object properties using dot notation
function getClaimByPath(obj, path = config.oauth.claims.privilegesRaw) {
  if (!obj || !path) return [];
  try {
    // Split the path by dots and traverse the object
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value == null) return [];
      value = value[key];
    }
    return value || [];
  } catch {
    return [];
  }
}

// Helper function to decode and validate the JWT structure
function decodeToken(tokenJWT) {
    const tokenObj = jwt.decode(tokenJWT, { complete: true })
    if (!tokenObj) {
        throw new SmError.AuthorizeError("Token is not valid JWT")
    }
    return tokenObj
}

// Helper function to check for insecure kids
function checkInsecureKid(tokenObj) {
    if (!config.oauth.allowInsecureTokens && config.oauth.insecureKids.includes(tokenObj.header.kid)) {
        throw new SmError.InsecureTokenError(`Insecure kid found: ${tokenObj.header.kid}`)
    }
}

// Helper function to retrieve the signing key
async function getSigningKey(tokenObj) {
    let signingKey = jwksCache.getKey(tokenObj.header.kid)

    if (signingKey === null) {
        const result = await jwksCache.refreshCache(false) // Will not retry on failure
        if (result) {
            signingKey = jwksCache.getKey(tokenObj.header.kid)
        }
        if (!result || !signingKey) {
            signingKey = 'unknown'
            jwksCache.setKey(tokenObj.header.kid, signingKey)
            logger.writeWarn('auth', 'unknownKid', { kid: tokenObj.header.kid })
        }
    }

    if (signingKey === 'unknown') {
        throw new SmError.SigningKeyNotFoundError(`Signing key unknown for kid: ${tokenObj.header.kid}`)
    }

    return signingKey
}

// Helper function to verify the token
function verifyToken(tokenJWT, signingKey) {
    const options = config.oauth.audienceValue ? {audience: config.oauth.audienceValue} : undefined
    try {
        jwt.verify(tokenJWT, signingKey, options)
    } catch (e) {
        throw new SmError.AuthorizeError(e.message)
    }
}

// express middleware to validate token
const validateToken = async function (req, res, next) {
    try {
        const tokenJWT = getBearerToken(req)
        if (tokenJWT) {
            const tokenObj = decodeToken(tokenJWT)
            checkInsecureKid(tokenObj)
            const signingKey = await getSigningKey(tokenObj)
            verifyToken(tokenJWT, signingKey)

            req.access_token = tokenObj.payload
            req.bearer = tokenJWT
        }
        next()
    } catch (e) {
        next(e)
    }
}

// express middleware to setup user object, expects to be called after validateToken()
const setupUser = async function (req, res, next) {
    try {
        if (req.access_token) {
            // Get decoded JWT payload from request
            const tokenPayload = req.access_token
    
            // Get username from configured claims in token, or fall back through precedence list. 
            const usernamePrecedence = [config.oauth.claims.username, "preferred_username", config.oauth.claims.servicename, "azp", "client_id", "clientId"]
            const username = tokenPayload[usernamePrecedence.find(element => !!tokenPayload[element])]
            // If no username found, throw Privilege error
            if (username === undefined) {
                throw new SmError.AuthorizeError("No token claim mappable to username found")
            }
            
            const userObject = await UserService.getUserObject(username) ?? {username}

            if (userObject.status === 'unavailable') {
                throw new SmError.UserUnavailableError()
            }
            
            const refreshFields = {}
            let now = new Date().toUTCString()
            now = new Date(now).getTime()
            now = now / 1000 | 0 //https://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number
    
            if (!userObject?.lastAccess || now - userObject?.lastAccess >= config.settings.lastAccessResolution) {
                refreshFields.lastAccess = now
            }
            if (!userObject?.lastClaims || tokenPayload[config.oauth.claims.assertion] !== userObject?.lastClaims?.[config.oauth.claims.assertion]) {
                refreshFields.lastClaims = JSON.stringify(tokenPayload)
            }
            if (refreshFields.lastAccess || refreshFields.lastClaims) {
                const userId = await UserService.setUserData(userObject, refreshFields)
                if (userId != userObject.userId) {
                    userObject.userId = userId.toString()
                }
            }

            // Get privileges and check elevate param  
            userObject.privileges = {
                create_collection: getClaimByPath(tokenPayload).includes('create_collection'),
                admin: getClaimByPath(tokenPayload).includes('admin')
            }

            if ('elevate' in req.query && (req.query.elevate === 'true' && !userObject.privileges.admin)) {
                throw new SmError.InvalidElevationError() 
            }

            req.userObject = userObject
        }
        next()
    }
    catch (e) {
        next(e)
    }
}

// express-openapi-validator security handler
const validateOauthSecurity = function (req, requiredScopes) {
    if (!req.access_token) {
        throw new SmError.NoTokenError() 
    }
    // Get decoded JWT payload from request
    const tokenPayload = req.access_token

    // Check scopes
    const grantedScopes = typeof tokenPayload[config.oauth.claims.scope] === 'string' ? 
        tokenPayload[config.oauth.claims.scope].split(' ') : 
        tokenPayload[config.oauth.claims.scope]
    const commonScopes = _.intersectionWith(grantedScopes, requiredScopes, function(gs, rs) {
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
        throw new SmError.OutOfScopeError()
    }

    return true
}

// utility to extract bearer token from request
const getBearerToken = req => {
    if (!req.headers.authorization) return
    const headerParts = req.headers.authorization.split(' ')
    if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1]
}

// Check if JWKS contains any insecure key IDs
const containsInsecureKids = (kids) => {
    return kids.some(kid => config.oauth.insecureKids.includes(kid))
}

// setup the JWKS key handling client
const setupJwks = async function (jwksUri) {
    jwksCache = new JWKSCache({
        jwksUri,
        cacheMaxAge: config.oauth.cacheMaxAge * 60 * 1000, // convert minutes to milliseconds
    })
    jwksCache.on('cacheUpdate', (cache) => {
        logger.writeDebug('auth', 'jwksCacheEvent', { event: 'cacheUpdate', kids: jwksCache.getKidTypes() })
    })
    jwksCache.on('cacheStale', (cache) => {
        logger.writeDebug('auth', 'jwksCacheEvent', { event: 'cacheStale', message: cache })
        state.setOidcStatus(false)
        jwksCache.once('cacheUpdate', (cache) => {
            state.setOidcStatus(true)
        })
    })

    // refresh cache of signing keys
    const cacheResult = await jwksCache.refreshCache(false) // will not retry on failure
    if (!cacheResult) throw new Error('refresh jwks cache failed')
    const kids = jwksCache.getKids()
    if (!config.oauth.allowInsecureTokens && containsInsecureKids(kids)) {
        throw new Error('insecure_kid - JWKS contains insecure key IDs and STIGMAN_DEV_ALLOW_INSECURE_TOKENS is false')
    }

    logger.writeDebug('auth', 'discovery', { jwksUri, kids: jwksCache.getKidTypes() })
}

let initAttempt = 0
/*
* setDepStatus is a function that sets the status of a dependency
*/
async function initializeAuth() {
    const retries = config.settings.dependencyRetries
    const metadataUri = `${config.oauth.authority}/.well-known/openid-configuration`
    let jwksUri
    
    async function getJwks(bail) {
        logger.writeDebug('auth', 'discovery', { metadataUri, attempt: ++initAttempt })
        const response = await fetch(metadataUri, { method: 'GET' })
        const openidConfig = await response.json()
        logger.writeDebug('auth', 'discovery', { metadataUri, metadata: openidConfig})
        
        if (!openidConfig.jwks_uri) {
            const message = "No jwks_uri property found in oidcConfig"
            logger.writeError('auth', 'discovery', { success: false, metadataUri, message })
            bail(new Error(message)) // Bail if jwks_uri is not found
            return // return after bail
        }
        jwksUri = openidConfig.jwks_uri
        
        try {
            await setupJwks(jwksUri)
        } catch (error) {
            // If the error is from insecure kids detection, bail immediately
            if (error.message.startsWith('insecure_kid -')) {
                logger.writeError('auth', 'discovery', { success: false, metadataUri, message: error.message })
                bail(error) // This will immediately stop retrying
                return // Make sure to return after bail
            }
            throw error // Other errors will be retried
        }
    }
    
    await retry(getJwks, {
        retries,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
        onRetry: (error) => {
            state.setOidcStatus(false)
            logger.writeError('auth', 'discovery', { success: false, metadataUri, message: error.message })
        }
    })
    
    logger.writeInfo('auth', 'discovery', { success: true, metadataUri, jwksUri })
    state.setOidcStatus(true)
}

module.exports = {
    validateToken, 
    setupUser, 
    validateOauthSecurity, 
    initializeAuth, 
    getClaimByPath,
    checkInsecureKid,
    decodeToken,
    getSigningKey,
    verifyToken
}