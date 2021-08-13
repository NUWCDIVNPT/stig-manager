let config = require('./config');
const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const request = require('request')
const _ = require('lodash')
const {promisify} = require('util')
const User = require(`../service/${config.database.type}/UserService`)

var jwksUri
var client

const privilegeGetter = new Function("obj", "return obj?." + config.oauth.claims.privileges + " || [];");

const verifyRequest = async function (req, requiredScopes, securityDefinition) {
        let token = getBearerToken(req)
        if (!token) {
            throw({status: 401, message: 'OIDC bearer token must be provided'})

        }
        let options = {
            algorithms: ['RS256']
        }
        let decoded = await verifyAndDecodeToken (token, getKey, options)
        req.access_token = decoded
        req.bearer = token
        req.userObject = {
            username: decoded[config.oauth.claims.username] || decoded[config.oauth.claims.servicename] || 'null',
            display: decoded[config.oauth.claims.name] || 'USER',
        }

        let grantedScopes = decoded.scope.split(' ')
        let commonScopes = _.intersectionWith(grantedScopes, requiredScopes, function(gs,rs) {
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
            throw({status: 403, message: 'Not in scope'})
        }
        else {      
            // Get privileges      
            const privileges = {}
            privileges.canCreateCollection = privilegeGetter(decoded).includes('create_collection')
            privileges.canAdmin = privilegeGetter(decoded).includes('admin')

            req.userObject.privileges = privileges
            const response = await User.getUserByUsername(req.userObject.username, ['collectionGrants', 'statistics'], false, null)   
            req.userObject.userId = response?.userId || null
            req.userObject.collectionGrants = response?.collectionGrants || []
            req.userObject.statistics = response?.statistics || {}
            
            const refreshFields = {}
            let now = new Date().toUTCString()
            now = new Date(now).getTime()
            now = now / 1000 | 0 //https://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number

            if (!response?.statistics?.lastAccess || now - response?.statistics?.lastAccess >= config.settings.lastAccessResolution) {
                refreshFields.lastAccess = now
            }
            if (!response?.statistics?.lastClaims || decoded.jti !== response?.statistics?.lastClaims?.jti) {
                refreshFields.lastClaims = decoded
            }
            if (req.userObject.username && (refreshFields.lastAccess || refreshFields.lastClaims)) {
                let userId = await User.setUserData(req.userObject, refreshFields)
                if (userId != req.userObject.userId) {
                    req.userObject.userId = userId.toString()
                }
            }
            if ('elevate' in req.query && (req.query.elevate === 'true' && !req.userObject.privileges.canAdmin)) {
                throw({status: 403, message: 'User has insufficient privilege to complete this request.'})
            }
            return true;
        }

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
            var signingKey = key.publicKey || key.rsaPublicKey
            callback(null, signingKey)
        } else {
            callback(err, null)
        }
    })
}

function initializeAuth() {
    return new Promise ((resolve, reject) => {
        getJwks()

        function getJwks() {
            let wellKnown = config.oauth.authority + "/.well-known/openid-configuration"
            console.info("[AUTH] Trying OIDC discovery at " + wellKnown)
            request(wellKnown, function(err, res, body) {
                if (err) {
                    function replaceErrors(key, value) {
                        if (value instanceof Error) {
                            var error = {}
                    
                            Object.getOwnPropertyNames(value).forEach(function (propName) {
                                error[propName] = value[propName]
                            })
                    
                            return error
                        }
                    
                        return value
                    }
                    console.info(`[AUTH] ERROR ${JSON.stringify(err, replaceErrors)}`)
                    console.info(`[AUTH] Couldn't connect. Trying again in 5 seconds...`)
                    setTimeout(getJwks, 5000)
                    return
                } else {
                    try {
                        if ( res.statusCode !== 200 ) {
                            throw( new Error('[AUTH] Response other than 200 status code') )
                        }
                        let openidConfig = JSON.parse(body)
                        if (!openidConfig.jwks_uri) {
                            throw( new Error('[AUTH] No jwks_uri property found') )
                        }
                        jwksUri = openidConfig.jwks_uri
                        client = jwksClient({
                            jwksUri: jwksUri
                        })
                        console.info("[AUTH] Received OIDC signing keys")
                        resolve()
                    }
                    catch (e) {
                        reject(e)
                    }
                }
            })
        }       
    })
}

// OpenID Connect Discovery

module.exports = {verifyRequest, initializeAuth}