let config = require('./config');
const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const request = require('request')
const writer = require('./writer.js')
const _ = require('lodash')
const {promisify} = require('util')
const db = require(`../service/${config.database.type}/utils`)

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
            req.userObject = await db.getUserObject(decoded.preferred_username)
            if (req.userObject) {
                req.access_token = decoded
                req.bearer = token
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

function getJwks() {
    let wellKnown = config.oauth.authority + "/.well-known/openid-configuration"
    console.info("Trying OpenID discovery at " + wellKnown)
    request(wellKnown, function(err, res, body) {
        if (err) {
            console.info("Couldn't get jwks_uri. Try again in 5 seconds...")
            setTimeout(getJwks, 5000)
        } else {
            let openidConfig = JSON.parse(body)
            jwksUri = openidConfig.jwks_uri
            client = jwksClient({
                jwksUri: jwksUri
            })
            console.info("Got jwks_uri")
        }
    })
}

if (config.oauth.disable == 'true') {
    console.log("OAuth2 support is disabled")
} else {
    getJwks()
}

// OpenID Connect Discovery

module.exports = {verifyRequest}