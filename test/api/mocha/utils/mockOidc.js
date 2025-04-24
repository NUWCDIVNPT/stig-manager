import http from 'node:http'
import { URL } from 'node:url'
import jsonwebtoken from 'jsonwebtoken'
import crypto from 'node:crypto'
import ms from 'ms'

class MockOidc {
  constructor ({includeInsecureKid = false, keyCount = 1} = {}) {
    this.rotateKeys({keyCount, includeInsecureKid})
    this.authCodes = {}
    this.sids = {}
  }

  clientCredentialsLifetime = 3600

  rotateKeys ({includeInsecureKid = false, keyCount = 1} = {}) {
    this.keys = new Map()
    
    for (let i = 0; i < keyCount; i++) {
      const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 1024})
      const publicKeyJwk = publicKey.export({ format: 'jwk', type: 'spki' })
      publicKeyJwk.alg = 'RS256'
      publicKeyJwk.use = 'sig'
      publicKeyJwk.kid = this.createKeyId(publicKey)
      this.keys.set(publicKeyJwk.kid, { publicKeyJwk, privateKey, publicKey })
    }
    if (includeInsecureKid) {
      const { kid, publicKeyJwk, privateKey, publicKey } = this.createInsecureKey()
      this.keys.set(kid, { publicKeyJwk, privateKey, publicKey })
    }
    return this.keys
  }

  createKeyId (publicKey) {
    // Compute the SHA-256 digest of the DER-encoded public key
    const sha256Digest = crypto.createHash('sha256')
      .update(publicKey.export({ format: 'der', type: 'spki' }))
      .digest()
    // Convert the digest to Base64
    const base64Digest = sha256Digest.toString('base64')
    // Convert Base64 to Base64url (replace + with -, / with _, and remove =)
    const base64urlDigest = base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return base64urlDigest
  }

  createInsecureKey () {
    const privateKey = crypto.createPrivateKey({
      key: {
        kty: "RSA",
        n: "q1awrk7QK24Gmcy9Yb4dMbS-ZnO6NDaj1Z2F5C74HMIgtwYyxsNbRhBqCWlw7kmkZZaG5udyQYY8d91Db_uc_1DBuJMrQVsYXjVSpy-hoKpTWmzGhXzyzwhfJAICp7Iu_TTKPp-ip0mPGHlJnnP6dr4ztjY7EgFXFhEDFYSd9S8",
        e: "AQAB",
        d: "fmO8gVhyBxdqlxmIuglbz8bcjQbhXJLR2EoS8ngTXmN1bo2L90M0mUKSdc7qF10LgETBzqL8jYlQIbt-e6TH8fcEpKCjUlyq0Mf_vVbfZSNaVycY13nTzo27iPyWQHK5NLuJzn1xvxxrUeXI6A2WFpGEBLbHjwpx5WQG9A-2scE",
        p: "73Z_TRO-Rz01T8QarBHds9dEypJfQmcbtdEG8t4kEJlixCfSzZst2nLyqxN4DImDVm-sRzyoiKjkdWrOy9uGkw",
        q: "tyvQOlCvr5kAjVqrEKXalj0Tzewjweuxc0pskvArTI2Oo070h65GpoIKLc9jf-UA69cRtquwP93aZKtW06U8dQ",
        dp: "F2Y44ks_mK5-eyDqik3koCI08qaC8HYq2wVl7G2QkJ6sbAaILtcvD92ToOvyGyeE0flvmDZxMYlvaZnaQ0lcSQ",
        dq: "plTq6YmLf_F4RuQmox94tyUPbtcYQWg942uZ3HSrXQDOng18kBj5nwpHJAJHYEQb6g2K0E5n5hcX0oKkfdx2YQ",
        qi: "cSKAmFiD7KQ6-vVqJlQwVPvYdTSOeZB7YVV6S4b4slS3ZObsa0yNMWgal_QnCtW5k3f185gCWj6dOLGB5btfxg"
      },
      format: 'jwk'
    })

    const publicKey = crypto.createPublicKey({key: privateKey})
    const publicKeyJwk = publicKey.export({ format: 'jwk', type: 'spki' })
    publicKeyJwk.alg = 'RS256'
    publicKeyJwk.use = 'sig'
    publicKeyJwk.kid = this.createKeyId(publicKey)
    return { kid: publicKeyJwk.kid, publicKeyJwk, privateKey, publicKey }
  }

  getJwks () {
    return { 
      keys: Array.from(this.keys.values()).map(key => key.publicKeyJwk)
    }
  }

  getMetadata (origin = '127.0.0.1:8080') {
    return {
      issuer: `http://${origin}`,
      authorization_endpoint: `http://${origin}/auth`,
      token_endpoint: `http://${origin}/token`,
      jwks_uri: `http://${origin}/jwks`,
    }
  }

  getToken ({
    roles = ['create_collection', 'admin'], 
    scope = 'stig-manager',
    username = 'admin',
    expiresIn = '1h',
    algorithm = 'RS256',
    issuedAt,
    kid,
    sid,
    auth_time
  }) {
    let privateKey
    if (kid) {
      privateKey = this.keys.get(kid).privateKey
      if (!privateKey) {
        throw new Error(`Key with kid ${kid} not found`)
      }
    } 
    else {
      // Use the first entry if no kid is provided
      [kid, {privateKey}] = this.keys.entries().next().value
    }

    if (typeof roles === 'string') {
      roles = [roles]
    }
    const jti = crypto.randomBytes(16).toString('hex')
  
    const payload = { 
      realm_access: {
        roles
      },
      scope,
      preferred_username: username,
      jti
    }

    if (issuedAt) {
      payload.iat = parseInt(issuedAt)
    }
    if (sid) {
      payload.sid = sid
    }
    if(auth_time) {
      payload.auth_time = auth_time
    }
    
    const options = {
      algorithm,
      expiresIn,
      keyid: kid,
      allowInsecureKeySizes: true
    }
    return jsonwebtoken.sign(payload, privateKey, options)
  }

  getCustomToken ({payload, privateKey, options}) {
    return jsonwebtoken.sign(payload, privateKey, options)
  }

  getRefreshToken ({sid, expiresIn = '1h', algorithm = 'RS256', kid}) {
    let privateKey
    if (kid) {
      privateKey = this.keys.get(kid).privateKey
      if (!privateKey) {
        throw new Error(`Key with kid ${kid} not found`)
      }
    } 
    else {
      // Use the first entry if no kid is provided
      [kid, {privateKey}] = this.keys.entries().next().value
    }
    const payload = { 
      sid
    }
    const options = {
      algorithm,
      expiresIn,
      keyid: kid,
      allowInsecureKeySizes: true
    }
    return jsonwebtoken.sign(payload, privateKey, options)
  }

  getAuthHtml({state, redirect_uri, response_mode} = {}) {
    
    const html =
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Get Token Form</title>
  <style>
    body {
      background-color: #121212;
      color: #ffffff;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #bb86fc;
      text-align: center;
    }
    label {
      color: #ffffff;
    }
    select {
      background-color: #1e1e1e;
      color: #ffffff;
      border: 1px solid #bb86fc;
      border-radius: 4px;
      padding: 8px;
      margin-top: 5px;
      margin-bottom: 15px;
      width: 100%;
      font-family: Arial, sans-serif;
    }
    input, button {
      background-color: #1e1e1e;
      color: #ffffff;
      border: 1px solid #bb86fc;
      border-radius: 4px;
      padding: 8px;
      margin-top: 5px;
      margin-bottom: 15px;
      width: 100%;
    }
    input[type="checkbox"] {
      width: auto;
    }
    button {
      cursor: pointer;
      font-weight: bold;
    }
    button:hover {
      background-color: #bb86fc;
      color: #121212;
    }
    select, input {
      box-sizing: border-box; /* Ensures padding and border are included in the width */
      width: 100%; /* Matches the width of the text input fields */
    }
    form {
      max-width: 400px;
      margin: 0 auto;
      background-color: #212121;
      padding: 20px;
      border-radius: 24px;
    }
  </style>
</head>
<body>
  <h1>Get Token</h1>
  <form action="/auth/callback" method="GET">
  <label for="username">Username:</label><br>
  <input type="text" id="username" name="username" value="admin"><br><br>

  <label>Roles:</label><br>
  <div style="display: flex; gap: 10px; align-items: left;">
    <div>
      <input type="checkbox" id="role-create-collection" name="roles" value="create_collection" checked>
      <label for="role-create-collection">Create Collection</label>
    </div>
    <div>
      <input type="checkbox" id="role-admin" name="roles" value="admin" checked>
      <label for="role-admin">Admin</label>
    </div>
  </div><br><br>

  <label for="expiresIn">Expires In (e.g., 1h):</label><br>
  <input type="text" id="expiresIn" name="expiresIn" value="60s"><br><br>

  <label for="refreshExpiresIn">Refresh Expires In (e.g., 1h):</label><br>
  <input type="text" id="refreshExpiresIn" name="refreshExpiresIn" value="180s"><br><br>

  <label for="scope">Scope:</label><br>
  <input type="text" id="scope" name="scope" value="stig-manager"><br><br>

  <label for="algorithm">Algorithm:</label><br>
  <select id="algorithm" name="algorithm">
    <option value="RS256" selected>RS256</option>
    <option value="RS384">RS384</option>
    <option value="RS512">RS512</option>
  </select><br><br>

  <label for="kid">Key ID (kid):</label><br>
  <select id="kid" name="kid">
    ${Array.from(this.keys.values()).map(key => `<option value="${key.publicKeyJwk.kid}">${key.publicKeyJwk.kid}</option>`).join('')}
  </select><br><br>

  <label for="issuedAt">Issued At (timestamp):</label><br>
  <input type="text" id="issuedAt" name="issuedAt"><br><br>

  <!-- Hidden fields for state, redirect_uri, and response_mode -->
  <input type="hidden" id="state" name="state" value="${state}">
  <input type="hidden" id="redirect_uri" name="redirect_uri" value="${redirect_uri}">
  <input type="hidden" id="response_mode" name="response_mode" value="${response_mode}">

  <button type="submit">Get Token</button>
</form>
</body>
</html>`
    return html
  }

  parseQueryParams(request) {
    // Construct a full URL using the request URL and a base URL
    const fullUrl = new URL(request.url, `http://${request.headers.host}`)
  
    // Create an object to store query parameters
    const queryParams = {}
  
    // Iterate over all keys in the searchParams
    for (const key of fullUrl.searchParams.keys()) {
      const values = fullUrl.searchParams.getAll(key) // Get all values for the key
      queryParams[key] = values.length > 1 ? values : values[0] // Use array if multiple values, otherwise single value
    }
  
    return queryParams
  }

  onRequest (request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`)
    let data
    if (url.pathname === '/.well-known/openid-configuration') {
      data = this.getMetadata(request.headers.host)
    }
    else if (url.pathname === '/jwks') {
       data = this.getJwks()
    }
    else if ( url.pathname === '/fetch-token') {
      const { roles, scope, username, expiresIn, algorithm, kid, issuedAt } = this.parseQueryParams(request)
      data = {
        access_token: this.getToken({ roles, scope, username, expiresIn, algorithm, kid, issuedAt })
      }
    }
    else if (url.pathname === '/auth') {
      const { redirect_uri, response_mode, state } = this.parseQueryParams(request)

      response.writeHead(200, { 'Content-Type': 'text/html'});
      response.end(this.getAuthHtml({ redirect_uri, response_mode, state }))
      return
    }
    else if (url.pathname === '/auth/callback') {
      const {state, redirect_uri, response_mode = 'query', roles = [], scope, username, expiresIn, refreshExpiresIn, algorithm, issuedAt, kid} = this.parseQueryParams(request)
      const auth_time = Math.floor(Date.now() / 1000)
      const sid = crypto.randomBytes(16).toString('hex')
      this.sids[sid] = {roles, scope, username, expiresIn, refreshExpiresIn, auth_time, algorithm, issuedAt, kid}
      const accessToken = this.getToken({ roles, scope, username, expiresIn, algorithm, issuedAt, kid, sid, auth_time })
      const refreshToken = this.getRefreshToken({ sid, expiresIn:refreshExpiresIn, algorithm, kid })
      const code = crypto.randomBytes(16).toString('hex')
      this.authCodes[code] = {accessToken, refreshToken, expiresIn}

      const responseUrl = new URL(redirect_uri)
      const searchParams = new URLSearchParams()
      searchParams.append('code', code)
      if (state) {
        searchParams.append('state', state)
      }
      if (response_mode === 'fragment') {
        responseUrl.hash = searchParams.toString()
      }
      else {
        responseUrl.search = searchParams.toString()
      }

      response.writeHead(302, { Location: responseUrl.toString() })
      response.end()
      return
    }
    else if (url.pathname === '/token' && request.method === 'POST') {
      let body = ''
      
      // Collect the POST body data
      request.on('data', chunk => {
        body += chunk.toString()
      })

      request.on('end', () => {
        let data
        // Parse the URL-encoded body
        const params = new URLSearchParams(body)
        const grantType = params.get('grant_type')
        if (grantType === 'authorization_code') {
          const code = params.get('code')

          const auth = this.authCodes[code]
          if (!auth) {
            response.writeHead(400, {'Access-Control-Allow-Origin': '*' })
            response.end('Invalid code')
            return
          }
        // if (auth.redirect_uri !== redirect_uri) {
        //   response.writeHead(400)
        //   response.end('Redirect URI mismatch')
        //   return
        // }

        // Prepare the token response
          data = {
            access_token: auth.accessToken,
            refresh_token: auth.refreshToken,
            token_type: 'Bearer',
            expires_in: ms(auth.expiresIn) / 1000
          }
          delete this.authCodes[code]
        }
        else if (grantType === 'refresh_token') {
          const refreshToken = params.get('refresh_token')
          const sid = jsonwebtoken.decode(refreshToken).sid
          const sessionParams = this.sids[sid]
          if (!sessionParams) {
            response.writeHead(400, {'Access-Control-Allow-Origin': '*' })
            response.end('Invalid refresh token')
            return
          }
          const { roles, scope, username, expiresIn, refreshExpiresIn, auth_time, algorithm, issuedAt, kid } = sessionParams
          const newAccessToken = this.getToken({ roles, scope, username, expiresIn, algorithm, issuedAt, kid, sid, auth_time })
          const newRefreshToken = this.getRefreshToken({ sid, expiresIn:refreshExpiresIn, algorithm, kid })
              
          data = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            expires_in: ms(expiresIn) / 1000
          }
        }
        else if (grantType === 'client_credentials') {
          const basicAuth = request.headers.authorization
          if (!basicAuth || !basicAuth.startsWith('Basic ')) {
            response.writeHead(401)
            response.end('Missing or invalid Basic Auth header')
            return
          }
          const base64Credentials = basicAuth.split(' ')[1]
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
          const [clientId] = credentials.split(':')
          // Check for scope parameter
          if (!params.has('scope')) {
            response.writeHead(400)
            response.end('Missing scope parameter')
            return
          }
          // Get the scope parameter
          const scope = params.get('scope')


          // Generate a new access token
          data = {
            access_token: this.getToken({ username: clientId, roles: [], scope, expiresIn: this.clientCredentialsLifetime}),
            token_type: 'Bearer',
            expires_in: this.clientCredentialsLifetime
          }
        }
        else {
          response.writeHead(400)
          response.end('Invalid grant type')
          return
        }
        // Send the token response

        response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        response.end(JSON.stringify(data))
      })

      return
    }
    else if (request.method === 'OPTIONS') {
      response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':  'X-Requested-With'})
      response.end()
      return
    }
    else {
      response.writeHead(404)
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    response.end(JSON.stringify(data))
  }

  start ({port = 8080}) {
    return new Promise((resolve, reject) => {
      this.server = http.createServer()
      this.server.on('error', reject)
      this.server.on('request', this.onRequest.bind(this))
      this.port = port
      this.server.listen(port, () => {
        resolve()
      })
    })
  }
  
  stop () {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
        this.server.closeAllConnections()
        this.server = null
      } 
      else {
        resolve()
      }
    })
  }
}

export default MockOidc