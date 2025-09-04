import { expect } from 'chai'
import { getPorts, spawnApiPromise, spawnMySQL, simpleRequest, execIpTables } from './lib.js'
import MockOidc from '../../utils/mockOidc.js'
import addContext from 'mochawesome/addContext.js'

const {apiPort, dbPort, oidcPort, apiOrigin, oidcOrigin} = getPorts(54010)

describe('DB outage: shutdown', function () {
  let api
  let mysql
  let oidc

  async function waitLogEvent(type, count = 1) {
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
    console.log('    try oidc start')
    await oidc.start({port: oidcPort})
    console.log('    ✔ oidc started')
    console.log('    try mysql start')
    mysql = await spawnMySQL({tag:'8.0.24', port:dbPort})
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
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'true'
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

  describe('DB up', function () {
    it('should return state "available"', async function () {
      this.timeout(20000)
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('DB shutdown', function () {
    before(async function () {
      this.timeout(30000)
      await mysql.stop()
      console.log('      mysql shutdown')
    })
    it('should return state "unavailable"', async function () {
      this.timeout(30000)
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('unavailable')
      expect(res.body.dependencies).to.eql({db: false, oidc: true})     
    })

    it('should log retry fail', async function () {
      this.timeout(30000)
      console.log('      wait for log: restore (2)')
      const log = await waitLogEvent('restore', 2)
      expect(log.data.message).to.equal(`connect ECONNREFUSED 127.0.0.1:${dbPort}`)
    })
  })

  describe('DB restarted', function() {
    before( async function() {
      this.timeout(30000)
      console.log('      try mysql restart')
      mysql = await spawnMySQL({tag: '8.0.24', port: dbPort})
      console.log('      ✔ mysql restarted')
    })

    it('should return state "available"', async function () {
      this.timeout(60000)
      console.log('      wait for log: state-changed')
      const log = await waitLogEvent('state-changed')
      expect(log.data.currentState).to.equal('available')
      expect(log.data.previousState).to.equal('unavailable')
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
})

describe('DB outage: network/host down', function () {
  let api
  let mysql
  let oidc

  async function waitLogEvent(type, count = 1) {
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
    console.log('    try oidc start')
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
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'true'
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

  describe('Network/host up', function () {
    it('should return state "available"', async function () {
      this.timeout(20000)
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('Network/host down', function () {
    before(async function () {
      execIpTables(`-A OUTPUT -p tcp --dport ${dbPort} -j DROP`)
      console.log('      iptables dropping packets')
    })
    it('should return state "unavailable"', async function () {
      this.timeout(30000)
      console.log('      wait for log: state-changed')
      const log = await waitLogEvent('state-changed')
      expect(log.data.currentState).to.equal('unavailable')
      expect(log.data.previousState).to.equal('available')
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('unavailable')
      expect(res.body.dependencies).to.eql({db: false, oidc: true})     
    })

    it('should log retry fail', async function () {
      this.timeout(45000)
      console.log('      wait for log: restore (2)')
      const log = await waitLogEvent('restore', 2)
      expect(log.data.message).to.equal('connect ETIMEDOUT')
    })
  })

  describe('Network/host up', function() {
    before( async function() {
      this.timeout(30000)
      execIpTables(`-D OUTPUT -p tcp --dport ${dbPort} -j DROP`)
      console.log('      iptables accepting packets')
    })

    it('should return state "available"', async function () {
      this.timeout(60000)
      console.log('      wait for log: state-changed')
      const log = await waitLogEvent('state-changed')
      expect(log.data.currentState).to.equal('available')
      expect(log.data.previousState).to.equal('unavailable')
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
})
