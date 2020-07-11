let config = require('./config');
const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const request = require('request')
const writer = require('./writer.js')
const _ = require('lodash')
const {promisify} = require('util')
const User = require(`../service/${config.database.type}/UserService`)

var jwksUri
var client

const verifyRequest = async function (req, securityDefinition, requiredScopes, cb) {
    try {
        let token = getBearerToken(req)
        let options = {
            algorithms: ['RS256']
        }
        let decoded = await verifyAndDecodeToken (token, getKey, options)
        let grantedScopes = decoded.scope.split(' ')
        let commonScopes = _.intersectionWith(grantedScopes, requiredScopes, function(gs,rs) {
            if (gs == rs) return gs
            let gsTokens = gs.split(":").filter(i => i.length)
            let rsTokens = rs.split(":").filter(i => i.length)
            return gsTokens.every((t, i) => rsTokens[i] === t)
        })
        if (commonScopes.length == 0) {
            console.log("No common scopes")
            writer.writeJson(req.res,{message: 'Not in scope'},403)
        }
        else {
            const response = await User.getUsers(decoded.preferred_username, ['privileges', 'collectionGrants', 'statistics'])
            if (response.length) {
                req.userObject = response[0]
                req.access_token = decoded
                req.bearer = token
                let now = new Date().toUTCString()
                now = new Date(now).getTime()
                now = now / 1000 | 0 //https://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number
                if (now - req.userObject.statistics.lastAccess >= config.settings.lastAccessResolution) {
                    // Do not await
                    User.setLastAccess(req.userObject.userId, now)
                }
                if ('elevate' in req.query && (req.query.elevate === 'true' && !req.userObject.privileges.canAdmin)) {
                    writer.writeJson(req.res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
                    return
                }
                cb()
            } else {
                writer.writeJson(req.res, {status: 403, message: `User ${decoded.preferred_username} not found`}, 403)
            }
        }
    }
    catch (err) {
        writer.writeJson(req.res, { status: 403, message: err.message }, 403)
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
            console.info("Trying OpenID discovery at " + wellKnown)
            request(wellKnown, function(err, res, body) {
                if (err) {
                    console.info("Couldn't get jwks_uri. Try again in 5 seconds...")
                    setTimeout(getJwks, 5000)
                    return
                } else {
                    let openidConfig = JSON.parse(body)
                    jwksUri = openidConfig.jwks_uri
                    client = jwksClient({
                        jwksUri: jwksUri
                    })
                    console.info("Got jwks_uri")
                    resolve()
                }
            })
        }       
    })
}

// OpenID Connect Discovery

module.exports = {verifyRequest, initializeAuth}