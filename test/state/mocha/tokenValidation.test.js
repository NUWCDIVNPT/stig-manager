import { expect } from 'chai'
import { getPorts, spawnApiPromise, spawnMySQL, bearerRequest } from './lib.js'
import MockOidc from '../../utils/mockOidc.js'
import addContext from 'mochawesome/addContext.js'

const {apiPort, dbPort, oidcPort, apiOrigin} = getPorts(54000)

describe('Token validation', function () {
  let api
  let mysql
  let oidc

  const {apiPort, dbPort, oidcPort, apiOrigin, oidcOrigin} = getPorts(54040)
    
  describe('Token audience validation', function () {
    const STIGMAN_JWT_AUD_VALUE = 'audience-value'
    before(async function () {
      this.timeout(60000)
      oidc = new MockOidc({keyCount: 1, includeInsecureKid: false})
      await oidc.start({port: oidcPort})
      console.log('    ✔ oidc started')
      console.log('    try mysql start')
      mysql = await spawnMySQL({tag:'8.0.24', port: dbPort})
      console.log('    ✔ mysql started')
      console.log('    try api start')
      api = await spawnApiPromise({
        resolveOnType: 'started',
        resolveOnClose: false,
        env: {
          STIGMAN_API_PORT: apiPort,
          STIGMAN_DEPENDENCY_RETRIES: 2,
          STIGMAN_DB_PASSWORD: 'stigman',
          STIGMAN_DB_HOST: '127.0.0.1',
          STIGMAN_DB_PORT: dbPort, 
          STIGMAN_OIDC_PROVIDER: oidcOrigin,
          STIGMAN_LOG_LEVEL: '4',
          STIGMAN_JWT_AUD_VALUE
        }
      })
      console.log('    ✔ api started')
    })

    after(async function () {
      await api.stop()
      await mysql.stop()
      await oidc.stop()
      addContext(this, {title: 'api-log', value: api.logRecords})
    })

    it('should accept token having correct audience (string)', async function () {
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, audience: STIGMAN_JWT_AUD_VALUE})
      })
      expect(res.status).to.equal(200)
    })
    it('should accept token having correct audience (list)', async function () {
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, audience: [STIGMAN_JWT_AUD_VALUE, 'another-audience']})
      })
      expect(res.status).to.equal(200)
    })
    it('should reject token without an audience', async function () {
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username})
      })
      expect(res.status).to.equal(401)
      expect(res.body.error).to.equal(`Request not authorized.`)
      expect(res.body.detail).to.equal(`jwt audience invalid. expected: ${STIGMAN_JWT_AUD_VALUE}`)
    })
    it('should reject token with incorrect audience', async function () {
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, audience: 'wrong-audience'})
      })
      expect(res.status).to.equal(401)
      expect(res.body.error).to.equal(`Request not authorized.`)
      expect(res.body.detail).to.equal(`jwt audience invalid. expected: ${STIGMAN_JWT_AUD_VALUE}`)
    })
    it('should reject expired token with correct audience', async function () {
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, audience: STIGMAN_JWT_AUD_VALUE, expiresIn: -60}) // token expired 60 seconds ago
      })
      expect(res.status).to.equal(401)
      expect(res.body.error).to.equal(`Request not authorized.`)
      expect(res.body.detail).to.equal(`jwt expired`)
    })
    it('should reject unscoped token with correct audience', async function () {
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, audience: STIGMAN_JWT_AUD_VALUE, scope: 'stig-manager:stig'})
      })
      expect(res.status).to.equal(403)
      expect(res.body.error).to.equal(`Required scopes were not found in token.`)
    })
  })
})
