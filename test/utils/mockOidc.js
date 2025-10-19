import http from 'node:http'
import { URL, fileURLToPath } from 'node:url'
import jsonwebtoken from 'jsonwebtoken'
import crypto from 'node:crypto'
import ms from 'ms'
import path from 'node:path'

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

  getMetadata (request = {}) {
    let host = '127.0.0.1:8080'
    let proto = 'http'
    let prefix = ''
    if (request.headers['x-forwarded-host']) {
      host = request.headers['x-forwarded-host']
    } else if (request.headers.host) {
      host = request.headers.host
    }
    if (request.headers['x-forwarded-proto']) {
      proto = request.headers['x-forwarded-proto']
    }
    if (request.headers['x-forwarded-prefix']) {
      prefix = request.headers['x-forwarded-prefix']
    }
    const origin = `${host}${prefix}`

    return {
      issuer: `${proto}://${origin}`,
      authorization_endpoint: `${proto}://${origin}/auth`,
      token_endpoint: `${proto}://${origin}/token`,
      jwks_uri: `${proto}://${origin}/jwks`,
      end_session_endpoint: `${proto}://${origin}/logout`,
      code_challenge_methods_supported: ['S256'],
    }
  }

  getToken({
    privileges = ['create_collection', 'admin'],
    scope = 'stig-manager',
    audience,
    username = 'admin',
    expiresIn = '1h',
    algorithm = 'RS256',
    name,
    email,
    issuedAt,
    kid,
    sid,
    auth_time,
    privilegesClaim = 'realm_access.roles',
    usernameClaim = 'preferred_username',
    nameClaim = 'name',
    scopeClaim = 'scope',
    emailClaim = 'email',
    assertionClaim = 'jti'
  }) {
    let privateKey
    if (kid) {
      privateKey = this.keys.get(kid).privateKey
      if (!privateKey) {
        throw new Error(`Key with kid ${kid} not found`)
      }
    } else {
      // Use the first entry if no kid is provided
      [kid, { privateKey }] = this.keys.entries().next().value
    }

    if (typeof privileges === 'string') {
      privileges = [privileges]
    }
    if (!name) {
      name = username
    }

    // Helper function to construct any nested objects
    const setDynamicClaim = (obj, path, value) => {
      if (!value) return
      const keys = path.split('.')
      let current = obj
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!current[key]) {
          current[key] = {}
        }
        current = current[key]
      }
      current[keys[keys.length - 1]] = value
    }

    // Create the payload for the JWT
    const payload = {}
    setDynamicClaim(payload, assertionClaim, crypto.randomBytes(16).toString('hex'))
    setDynamicClaim(payload, privilegesClaim, privileges)
    setDynamicClaim(payload, usernameClaim, username)
    setDynamicClaim(payload, nameClaim, name)
    setDynamicClaim(payload, emailClaim, email)
    setDynamicClaim(payload, scopeClaim, scope)

    if (issuedAt) {
      payload.iat = parseInt(issuedAt)
    }
    if (sid) {
      payload.sid = sid
    }
    if (auth_time) {
      payload.auth_time = auth_time
    }
    if (audience) {
      payload.aud = audience
    }

    const options = {
      algorithm,
      expiresIn,
      keyid: kid,
      allowInsecureKeySizes: true,
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
    } else {
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

  getAuthHtml({ state, redirect_uri, response_mode, prefix } = {}) {
    const html = `
  <!DOCTYPE html>
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
      select, input, button {
        background-color: #1e1e1e;
        color: #ffffff;
        border: 1px solid #bb86fc;
        border-radius: 4px;
        padding: 8px;
        margin-top: 5px;
        margin-bottom: 15px;
        width: 100%;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
      }
      input[type="checkbox"] {
        width: auto;
      }
      button {
        cursor: pointer;
        font-weight: bold;
        grid-column: 2;
        justify-self: right;
        background-color: #38264f;
        width: 120px;
      }
      button:hover {
        background-color: #bb86fc;
        color: #121212;
      }
      form {
        max-width: 800px;
        margin: 0 auto;
        background-color: #212121;
        padding: 20px;
        border-radius: 24px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      @media (max-height: 500px) {
        form {
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
      }
    </style>
    <script>
      function loadFormValues() {
        const fields = {
          'username': 'admin',
          'usernameClaim': 'preferred_username',
          'privilege-admin': 'true',
          'privilege-create-collection': 'true',
          'privilegesClaim': 'realm_access.roles',
          'expiresIn': '60s',
          'refreshExpiresIn': '180s',
          'sessionExpiresIn': '*unimplemented*',
          'audience': 'stig-manager',
          'scope': 'stig-manager',
          'scopeClaim': 'scope',
          'algorithm': 'RS256',
          'kid': '0'
        }
        for (const field in fields) {
          let value = localStorage.getItem(field);
          if (!value) {
            value = fields[field];
          }
          const input = document.getElementById(field);
          if (input && input.type === 'checkbox') {
            input.checked = value === 'true';
          } else if (input && input.type === 'select-one') {
            let index = parseInt(value);
            if (isNaN(index) || index < 0 || index >= input.options.length) {
              index = 0;
            }
            input.selectedIndex = index;
          } else if (input) {
            input.value = value;
          }
        }
      }
  
      function saveFormValues() {
        const fields = ['username', 'usernameClaim', 'audience', 'privilege-admin', 'privilege-create-collection', 'privilegesClaim', 'expiresIn', 'refreshExpiresIn', 'scope', 'scopeClaim', 'algorithm', 'kid'];
        for (const field of fields) {
          const input = document.getElementById(field);
          if (input && input.type === 'checkbox') {
            localStorage.setItem(field, input.checked);
          } else if (input && input.type === 'select-one') {
            localStorage.setItem(field, input.selectedIndex);
          } else if (input) {
            localStorage.setItem(field, input.value);
          }
        }
      }
  
      window.onload = () => {
        loadFormValues();

        // Add keydown listener to the form for Enter key submission
        window.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default behavior
            saveFormValues()
            document.querySelector('form').submit(); // Submit the form programmatically
          }
        });
      };

      
    </script>
  </head>
  <body>
    <h1>Get Token</h1>
    <form action="${prefix}/auth/callback" method="GET" onsubmit="saveFormValues()">
      <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username">
      </div>
      <div class="form-group">
        <label for="usernameClaim">Username claim:</label>
        <input type="text" id="usernameClaim" name="usernameClaim">
      </div>

      <div class="form-group">
        <label>Privileges:</label>
        <div style="display: flex; gap: 10px; padding-top:10px;">
          <div>
            <input type="checkbox" id="privilege-create-collection" name="privileges" value="create_collection" checked>
            <label for="privilege-create-collection">create_collection</label>
          </div>
          <div>
            <input type="checkbox" id="privilege-admin" name="privileges" value="admin" checked>
            <label for="privilege-admin">admin</label>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="privilegesClaim">Privileges claim:</label>
        <input type="text" id="privilegesClaim" name="privilegesClaim">
      </div>
      <div class="form-group">
        <label for="expiresIn">Expires In (e.g., 20s):</label>
        <input type="text" id="expiresIn" name="expiresIn">
      </div>
      <div class="form-group">
        <label for="refreshExpiresIn">Refresh Expires In (e.g., 1m):</label>
        <input type="text" id="refreshExpiresIn" name="refreshExpiresIn">
      </div>
      <div class="form-group">
        <label for="sessionExpiresIn">Session Expires In (e.g., 1h):</label>
        <input type="text" id="sessionExpiresIn" name="sessionExpiresIn" disabled>
      </div>
      <div class="form-group">
        <label for="audience">Audience:</label>
        <input type="text" id="audience" name="audience">
      </div>
      <div class="form-group">
        <label for="scope">Scope:</label>
        <input type="text" id="scope" name="scope">
      </div>
      <div class="form-group">
        <label for="scopeClaim">Scope claim:</label>
        <input type="text" id="scopeClaim" name="scopeClaim">
      </div>
      <div class="form-group">
        <label for="algorithm">Algorithm:</label>
        <select id="algorithm" name="algorithm">
          <option value="RS256" selected>RS256</option>
          <option value="RS384">RS384</option>
          <option value="RS512">RS512</option>
        </select>
      </div>
      <div class="form-group">
        <label for="kid">Key ID (kid):</label>
        <select id="kid" name="kid">
          ${Array.from(this.keys.values()).map(key => `<option value="${key.publicKeyJwk.kid}">${key.publicKeyJwk.kid}</option>`).join('')}
        </select>
      </div>
      <input type="hidden" id="state" name="state" value="${state}">
      <input type="hidden" id="redirect_uri" name="redirect_uri" value="${redirect_uri}">
      <input type="hidden" id="response_mode" name="response_mode" value="${response_mode}">
      <button type="submit">Get Token</button>
    </form>
  </body>
  </html>`;
    return html;
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

    const getCookie = (cookieName) => {
      const cookies = request.headers.cookie; // Retrieve the 'Cookie' header
      if (!cookies) return null; // Return null if no cookies are present
  
      // Split cookies into key-value pairs and find the desired cookie
      const cookie = cookies.split(';').find((c) => c.trim().startsWith(`${cookieName}=`));
      return cookie ? cookie.split('=')[1] : null; // Return the cookie value or null
    };
  
    if (url.pathname === '/.well-known/openid-configuration') {
      data = this.getMetadata(request)
    } else if (url.pathname === '/jwks') {
       data = this.getJwks()
    } else if ( url.pathname === '/api/get-token') {
      const { privileges, audience, scope, username, expiresIn, algorithm, kid, issuedAt } = this.parseQueryParams(request)
      const token = this.getToken({ privileges: privileges === '' ? [] : privileges, audience, scope, username, expiresIn, algorithm, kid, issuedAt })
      data = {
        token,
        tokenDecoded: jsonwebtoken.decode(token, {complete: true})
      }
    } else if ( url.pathname === '/api/rotate-keys') {
      const { includeInsecureKid, keyCount } = this.parseQueryParams(request)
      this.rotateKeys({ includeInsecureKid: includeInsecureKid === 'true', keyCount })
      data = this.getJwks()
    } else if (url.pathname === '/auth') {
      const { redirect_uri, response_mode, state } = this.parseQueryParams(request)
      const sid = getCookie('sid')
      if (sid) {
        const sessionParams = this.sids[sid]
        if (sessionParams) {
          const accessToken = this.getToken(sessionParams)
          const refreshToken = sessionParams.refreshExpiresIn !== '0' ? this.getRefreshToken({ 
            sid: sessionParams.sid, 
            expiresIn:sessionParams.refreshExpiresIn, 
            algorithm:sessionParams.algorithm, 
            kid:sessionParams.kid }) : undefined
          const code = crypto.randomBytes(16).toString('hex')
          this.authCodes[code] = {accessToken, refreshToken, expiresIn: sessionParams.expiresIn}
    
          const responseUrl = new URL(redirect_uri)
          const searchParams = new URLSearchParams()
          searchParams.append('code', code)
          if (state) {
            searchParams.append('state', state)
          }
          if (response_mode === 'fragment') {
            responseUrl.hash = searchParams.toString()
          } else {
            responseUrl.search = searchParams.toString()
          }
    
          response.writeHead(302, {
            Location: responseUrl.toString(),
            'Set-Cookie': `sid=${sid}; Path=/;`
          })
        
          response.end()
          return
        }
      }
      response.writeHead(200, { 'Content-Type': 'text/html'})
      response.end(this.getAuthHtml({ redirect_uri, response_mode, state, prefix: request.headers['x-forwarded-prefix'] || '' }))
      return
    } else if (url.pathname === '/auth/callback') {
      const {
        state, 
        redirect_uri, 
        response_mode = 'query', 
        privileges = [], 
        scope, 
        username, 
        expiresIn, 
        refreshExpiresIn, 
        sessionExpiresIn,
        audience,
        algorithm, 
        issuedAt, 
        kid,
        privilegesClaim = 'realm_access.roles',
        usernameClaim = 'preferred_username',
        scopeClaim = 'scope'
      } = this.parseQueryParams(request)
      const auth_time = Math.floor(Date.now() / 1000)
      const sid = crypto.randomBytes(16).toString('hex')
      this.sids[sid] = {
        sid,
        privileges, 
        scope, 
        username, 
        expiresIn, 
        refreshExpiresIn, 
        sessionExpiresIn,
        audience,
        auth_time, 
        algorithm, 
        issuedAt, 
        kid,
        privilegesClaim,
        usernameClaim,
        scopeClaim
      }
      const accessToken = this.getToken({ privileges, scope, audience, username, expiresIn, algorithm, issuedAt, kid, sid, auth_time, privilegesClaim, usernameClaim, scopeClaim })
      const refreshToken = refreshExpiresIn !== '0' ? this.getRefreshToken({ sid, expiresIn:refreshExpiresIn, algorithm, kid }) : undefined
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
      } else {
        responseUrl.search = searchParams.toString()
      }

      response.writeHead(302, {
        Location: responseUrl.toString(),
        'Set-Cookie': `sid=${sid}; Path=/;`
      })
    
      response.end()
      return
    } else if (url.pathname === '/token' && request.method === 'POST') {
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

        // Prepare the token response
          data = {
            access_token: auth.accessToken,
            refresh_token: auth.refreshToken,
            token_type: 'Bearer',
            expires_in: ms(auth.expiresIn) / 1000
          }
          delete this.authCodes[code]
        } else if (grantType === 'refresh_token') {
          const refreshToken = params.get('refresh_token')
          const sid = jsonwebtoken.decode(refreshToken).sid
          const sessionParams = this.sids[sid]
          if (!sessionParams) {
            response.writeHead(400, {'Access-Control-Allow-Origin': '*' })
            response.end('Invalid refresh token')
            return
          }
          const { privileges, audience, scope, username, expiresIn, refreshExpiresIn, auth_time, algorithm, issuedAt, kid } = sessionParams
          const newAccessToken = this.getToken({ privileges, audience, scope, username, expiresIn, algorithm, issuedAt, kid, sid, auth_time })
          const newRefreshToken = this.getRefreshToken({ sid, expiresIn:refreshExpiresIn, algorithm, kid })
              
          data = {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            expires_in: ms(expiresIn) / 1000
          }
        } else if (grantType === 'client_credentials') {
          const basicAuth = request.headers.authorization
          if (!basicAuth?.startsWith('Basic ')) {
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
            access_token: this.getToken({ username: clientId, privileges: [], scope, expiresIn: this.clientCredentialsLifetime}),
            token_type: 'Bearer',
            expires_in: this.clientCredentialsLifetime
          }
        } else {
          response.writeHead(400)
          response.end('Invalid grant type')
          return
        }
        // Send the token response
        response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
        response.end(JSON.stringify(data))
      })

      return
    } else if (url.pathname === '/logout') {
      const sid = getCookie('sid')
      if (!sid) {
        response.writeHead(400, {'Access-Control-Allow-Origin': '*' })
        response.end('Missing sid cookie')
        return
      }
      delete this.sids[sid]
      // const responseUrl = new URL(post_logout_redirect_uri)
      // response.writeHead(302, { Location: responseUrl.toString() })
      // response.end()
      response.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' })
      response.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Logout</title>
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
          </style>
        </head>
        <body>
          <h1>Logged out successfully</h1>
        </body>
        </html>
      `)
      return
    } else if (request.method === 'OPTIONS') {
      response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':  'X-Requested-With'})
      response.end()
      return
    } else {
      response.writeHead(404)
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'})
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
      } else {
        resolve()
      }
    })
  }
}

export default MockOidc

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  // Parse command-line arguments
  const args = process.argv.slice(2) // Exclude "node" and script name
  const options = {
    port: 8080,
    includeInsecureKid: false,
    keyCount: 1
  }

  // Simple argument parsing
  for (const [index, arg] of args.entries()) {
    if (arg === '--port' || arg === '-p') {
      options.port = parseInt(args[index + 1], 10)
    } else if (arg === '--include-insecure-kid' || arg === '-i') {
      options.includeInsecureKid = true // Flag, no value needed
    } else if (arg === '--key-count' || arg === '-k') {
      options.keyCount = parseInt(args[index + 1], 10)
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
  Usage: node mockOidc.js [options]
  
  Options:
    --port, -p <number>               Port to run the Mock OIDC server on (default: 8080)
    --include-insecure-kid, -i        Include insecure key IDs (default: false)
    --key-count, -k <number>          Number of keys to generate (default: 1)
    --help, -h                        Show this help message
  `)
      process.exit(0)
    }
  }

  // Create and start a MockOidc instance
  const oidc = new MockOidc({
    includeInsecureKid: options.includeInsecureKid,
    keyCount: options.keyCount
  })

  try {
    await oidc.start({ port: options.port })
    console.log(`Mock OIDC server started on port ${options.port}, with ${options.keyCount} key${options.keyCount !== 1 ? 's':''}${options.includeInsecureKid ? ' (plus insecure key)' : ''}`)
  } catch (err) {
    console.error('Failed to start Mock OIDC server:', err)
    process.exit(1)
  }

  // Gracefully handle termination signals
  process.on('SIGINT', async () => {
    console.log('Stopping Mock OIDC server...')
    await oidc.stop()
    console.log('Mock OIDC server stopped.')
    process.exit(0)
  })
}