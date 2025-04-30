import { expect, use } from 'chai'
import { getPorts, spawnApiPromise, spawnMySQL, bearerRequest } from './lib.js'
import MockOidc from '../../utils/mockOidc.js'
import addContext from 'mochawesome/addContext.js'
import chaiDateTime from 'chai-datetime'

use(chaiDateTime)

describe('JWKS Tests', function () {
  let api
  let mysql
  let oidc
  const tokens = {}

  const {apiPort, dbPort, oidcPort, apiOrigin, oidcOrigin} = getPorts(54020)

  before(async function () {
    this.timeout(30000)
    oidc = new MockOidc({keyCount: 1, includeInsecureKid: false})
    tokens.rotation0 = oidc.getToken({username: 'prerotation', privileges:['create_collection']}) // default privileges
    oidc.rotateKeys({keyCount: 1, includeInsecureKid: false})
    await oidc.start({port: oidcPort})
    console.log('    ✔ oidc started')
    console.log('    try mysql start')
    mysql = await spawnMySQL({tag:'8.0.24', port: dbPort})
    console.log('    ✔ mysql started')
    console.log('    try api start')
    api = await spawnApiPromise({
      resolveOnType: 'started',
      resolveOnClose: false,
      inspect: false,
      env: {
        STIGMAN_API_PORT: apiPort,
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_HOST: '127.0.0.1',
        STIGMAN_DB_PORT: `${dbPort}`, 
        STIGMAN_OIDC_PROVIDER: oidcOrigin,
        STIGMAN_LOG_LEVEL: '4',
        STIGMAN_JWKS_CACHE_MAX_AGE: 1
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
  
  describe('Create user according to token', function () {
    it('should return newly created user with create_collection', async function () {
      this.timeout(20000)
      const username = 'user01'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, privileges:['create_collection']})
      })
      expect(res.status).to.equal(200)
      expect(res.body.username).to.eql(username)
      expect(res.body.privileges).to.eql({create_collection: true, admin: false})
      expect(new Date(res.body.statistics.created)).to.be.closeToTime(new Date(), 1000)
    })
    it('should return newly created user with create_collection and admin', async function () {
      this.timeout(20000)
      const username = 'user02'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, privileges:['create_collection', 'admin']})
      })
      expect(res.status).to.equal(200)
      expect(res.body.username).to.eql(username)
      expect(res.body.privileges).to.eql({create_collection: true, admin: true})
      expect(new Date(res.body.statistics.created)).to.be.closeToTime(new Date(), 1000)
    })
    it('should return newly created user with no privileges', async function () {
      this.timeout(20000)
      const username = 'user03'
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token: oidc.getToken({username, privileges:[]})
      })
      expect(res.status).to.equal(200)
      expect(res.body.username).to.eql(username)
      expect(res.body.privileges).to.eql({create_collection: false, admin: false})
      expect(new Date(res.body.statistics.created)).to.be.closeToTime(new Date(), 1000)
    })
  })

  describe('Reject token with unknown kid after refreshing cache', function () {
    it('should log a cache refresh and reject unknown kid', async function () {
      this.timeout(20000)
      const logLength = api.logRecords.length
      const res = await bearerRequest({
          url: `${apiOrigin}/api/user`,
          method: 'GET',
          token: tokens.rotation0
        })
        
      expect(res.status).to.equal(401)
      expect(res.body.error).to.equal('Unknown signing key, unable to validate token.')

      const logSlice = api.logRecords.slice(logLength)
      const cacheUpdateCount = logSlice.filter(log => log.type === 'jwksCacheEvent' && log.data.event === 'cacheUpdate').length
      expect(cacheUpdateCount).to.equal(1)
    })
  })

  describe('Reject token with unknown kid without refreshing cache', function () {
    it('should reject unknown kid from cache', async function () {
      this.timeout(20000)
      const logLength = api.logRecords.length
      const res = await bearerRequest({
          url: `${apiOrigin}/api/user`,
          method: 'GET',
          token: tokens.rotation0
        })
        
      expect(res.status).to.equal(401)
      expect(res.body.error).to.equal('Unknown signing key, unable to validate token.')

      const logSlice = api.logRecords.slice(logLength)
      const cacheUpdateCount = logSlice.filter(log => log.type === 'jwksCacheEvent' && log.data.event === 'cacheUpdate').length
      expect(cacheUpdateCount).to.equal(0)
    })
  })

  describe('Reject token with empty username', function () {
    it('should reject empty username', async function () {
      this.timeout(20000)
      const res = await bearerRequest({
          url: `${apiOrigin}/api/user`,
          method: 'GET',
          token: oidc.getToken({username: '', privileges:[]})
        })
      expect(res.status).to.equal(401)
      expect(res.body.detail).to.equal('No token claim mappable to username found')
    })
  })

  describe('Reject token without mappable username claim', function () {
    it('should reject missing username', async function () {
      this.timeout(20000)
      const [kid, {privateKey}] = oidc.keys.entries().next().value
      const token = oidc.getCustomToken({
        payload: {
          unknown_claim: 'newuser',
          exp: Math.floor(Date.now() / 1000) + 60
        },
        privateKey: privateKey,
        options: {
          algorithm: 'RS256',
          allowInsecureKeySizes: true,
          keyid: kid
        }
      })
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token
      })
      expect(res.status).to.equal(401)
      expect(res.body.detail).to.equal('No token claim mappable to username found')
    })
  })

  describe('Reject expired token', function () {
    it('should reject expired token', async function () {
      this.timeout(20000)
      const [kid, {privateKey}] = oidc.keys.entries().next().value
      const token = oidc.getCustomToken({
        payload: {
          exp: Math.floor(Date.now() / 1000) - 60 // expired token
        },
        privateKey: privateKey,
        options: {
          algorithm: 'RS256',
          allowInsecureKeySizes: true,
          keyid: kid
        }
      })
      const res = await bearerRequest({
        url: `${apiOrigin}/api/user`,
        method: 'GET',
        token
      })
      expect(res.status).to.equal(401)
      expect(res.body.detail).to.equal('Token verification failed')
    })
  })
})