import { expect } from 'chai'
import { getPorts, spawnApiPromise, spawnMySQL, simpleRequest } from './lib.js'
import MockOidc from '../../utils/mockOidc.js'
import addContext from 'mochawesome/addContext.js'


describe('OIDC state', function () {
  let api
  let mysql
  let oidc
  let cachedKid

  const {apiPort, dbPort, oidcPort, apiOrigin, oidcOrigin} = getPorts(54030)
  
  async function waitLogType(type, count = 1) {
    let seen = 0
    return new Promise((resolve) => {
      api.logEvents.on(type, function (log) {
        seen++
        if (seen >= count) resolve(log)
      })
    })
  }
  
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
    await api.stop()
    await mysql.stop()
    await oidc.stop()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('OIDC up', function () {
    it('should log cacheUpdate with 1 kid', async function () {
      this.timeout(20000)
      console.log('      wait for log: jwksCacheEvent/cacheUpdate')
      const log = await waitLogType('jwksCacheEvent')
      expect(log.data.event).to.equal('cacheUpdate')
      const kids = Object.keys(log.data.kids)
      cachedKid = kids[0]
      expect(kids).to.have.lengthOf(1)
    })
    it('should return state "available"', async function () {
      this.timeout(20000)
      await waitLogType('started')
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('OIDC down', function () {
    before(async function () {
      await oidc.stop()
      console.log('      oidc shutdown')
    })
    it('should log cache update attempt', async function () {
      this.timeout(45000)
      console.log('      wait for log: refreshing cache')
      const log = await waitLogType('refreshing cache')
      expect(log.data.uri).to.equal(`${oidcOrigin}/jwks`)
    })
    it('should log refresh error', async function () {
      this.timeout(15000)
      console.log('      wait for log: refresh error')
      const log = await waitLogType('refresh error')
      expect(log.data.message).to.equal('updateCache returned false')
    })
    it('should return state "unavailable"', async function () {
      this.timeout(75000)
      console.log('      wait for log: state-changed')
      const log = await waitLogType('state-changed')
      expect(log.data.currentState).to.equal('unavailable')
      expect(log.data.previousState).to.equal('available')
    })
  })

  describe('OIDC restarted', function () {
    before(async function () {
      await oidc.start({port: oidcPort})
      console.log('      ✔ oidc started')
    })
    it('should log cacheUpdate with same kid as bootstrap', async function () {
      this.timeout(20000)
      console.log('      wait for log: jwksCacheEvent/cacheUpdate')
      const log = await waitLogType('jwksCacheEvent')
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
    before(async function () {
      await oidc.rotateKeys({keyCount: 1, includeInsecureKid: false})
      console.log('      ✔ oidc rekeyed')
    })
    it('should log cacheUpdate with different kid than bootstrap', async function () {
      this.timeout(40000)
      console.log('      wait for log: jwksCacheEvent/cacheUpdate')
      const log = await waitLogType('jwksCacheEvent')
      expect(log.data.event).to.equal('cacheUpdate')
      const kids = Object.keys(log.data.kids)
      expect(kids).to.have.lengthOf(1)
      expect(kids[0]).to.not.be.equal(cachedKid)
    })
  })
})

