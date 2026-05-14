import { expect } from 'chai'
import { getPorts, spawnApiPromise, spawnMySQL, simpleRequest, waitForLog } from './lib.js'
import MockOidc from '../../utils/mockOidc.js'
import addContext from 'mochawesome/addContext.js'


describe('OIDC state', function () {
  let api
  let mysql
  let oidc
  let cachedKid

  const {apiPort, dbPort, oidcPort, apiOrigin, oidcOrigin} = getPorts(54030)

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
      resolveOnType: null,
      resolveOnClose: false,
      env: {
        STIGMAN_API_PORT: apiPort,
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_HOST: '127.0.0.1',
        STIGMAN_DB_PORT: dbPort, 
        STIGMAN_OIDC_PROVIDER: oidcOrigin,
        STIGMAN_LOG_LEVEL: '4',
        STIGMAN_JWKS_CACHE_MAX_AGE: 1
      }
    })
    console.log('    ✔ api started')
  })

  after(async function () {
    this.timeout(60000)
    if (api) await api.stop().catch(() => {})
    if (mysql) await mysql.stop().catch(() => {})
    if (oidc) await oidc.stop().catch(() => {})
    if (api) addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('OIDC up', function () {
    it('should log cacheUpdate with 1 kid', async function () {
      this.timeout(20000)
      console.log('      wait for log: jwksCacheEvent/cacheUpdate')
      const log = await waitForLog(api, 'jwksCacheEvent')
      expect(log.data.event).to.equal('cacheUpdate')
      const kids = Object.keys(log.data.kids)
      cachedKid = kids[0]
      expect(kids).to.have.lengthOf(1)
    })
    it('should return state "available"', async function () {
      this.timeout(20000)
      await waitForLog(api, 'started')
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('OIDC down', function () {
    let logMark
    before(async function () {
      logMark = api.logRecords.length
      await oidc.stop()
      console.log('      oidc shutdown')
    })
    it('should log cache update attempt', async function () {
      this.timeout(45000)
      console.log('      wait for log: refreshing cache')
      const log = await waitForLog(api, 'refreshing cache', {since: logMark})
      expect(log.data.uri).to.equal(`${oidcOrigin}/jwks`)
    })
    it('should log refresh error', async function () {
      this.timeout(15000)
      console.log('      wait for log: refresh error')
      const log = await waitForLog(api, 'refresh error', {since: logMark})
      expect(log.data.message).to.equal('updateCache returned false')
    })
    it('should return state "unavailable"', async function () {
      this.timeout(75000)
      console.log('      wait for log: state-changed')
      const log = await waitForLog(api, 'state-changed', {since: logMark})
      expect(log.data.currentState).to.equal('unavailable')
      expect(log.data.previousState).to.equal('available')
    })
  })

  describe('OIDC restarted', function () {
    let logMark
    before(async function () {
      logMark = api.logRecords.length
      await oidc.start({port: oidcPort})
      console.log('      ✔ oidc started')
    })
    it('should log cacheUpdate with same kid as bootstrap', async function () {
      this.timeout(20000)
      console.log('      wait for log: jwksCacheEvent/cacheUpdate')
      const log = await waitForLog(api, 'jwksCacheEvent', {since: logMark})
      expect(log.data.event).to.equal('cacheUpdate')
      const kids = Object.keys(log.data.kids)
      expect(kids).to.have.lengthOf(1)
      expect(kids[0]).to.be.equal(cachedKid)
    })
    it('should return state "available"', async function () {
      this.timeout(75000)
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('OIDC rekeyed', function () {
    let logMark
    before(async function () {
      logMark = api.logRecords.length
      await oidc.rotateKeys({keyCount: 1, includeInsecureKid: false})
      console.log('      ✔ oidc rekeyed')
    })
    it('should log cacheUpdate with different kid than bootstrap', async function () {
      this.timeout(40000)
      console.log('      wait for log: jwksCacheEvent/cacheUpdate')
      const log = await waitForLog(api, 'jwksCacheEvent', {since: logMark})
      expect(log.data.event).to.equal('cacheUpdate')
      const kids = Object.keys(log.data.kids)
      expect(kids).to.have.lengthOf(1)
      expect(kids[0]).to.not.be.equal(cachedKid)
    })
  })
})

