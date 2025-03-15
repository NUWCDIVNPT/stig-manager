import { expect } from 'chai'
import { spawnApiPromise, spawnHttpServer, spawnMySQL, simpleRequest, execIpTables } from './lib.js'
import addContext from 'mochawesome/addContext.js'
import { execFileSync } from 'child_process'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))


describe('DB outage: shutdown', function () {
  let api
  let mysql
  let kc

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
    kc = spawnHttpServer({port:'8080'})
    console.log('    try mysql start')
    mysql = await spawnMySQL({tag:'8.0.24'})
    console.log('    ✔ mysql started')
    console.log('    try api start')
    api = await spawnApiPromise({
      resolveOnType: 'started',
      resolveOnClose: false,
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_HOST: '127.0.0.1',
        STIGMAN_DB_PORT: '3306',
        STIGMAN_OIDC_PROVIDER: `http://127.0.0.1:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'true'
      }
    })
    console.log('    ✔ api started')
  })

  after(function () {
    api.process.kill()
    console.log('    api killed')
    mysql.kill()
    console.log('    mysql killed')
    kc.kill()
    console.log('    kc killed')
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('DB up', function () {
    it('should return state "available"', async function () {
      this.timeout(20000)
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('DB shutdown', function () {
    before(async function () {
      mysql.kill()
      console.log('      mysql shutdown')
    })
    it('should return state "unavailable"', async function () {
      this.timeout(30000)
      console.log('      wait for log: statechanged')
      const log = await waitLogEvent('statechanged')
      expect(log.data.currentState).to.equal('unavailable')
      expect(log.data.previousState).to.equal('available')
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('unavailable')
      expect(res.body.dependencies).to.eql({db: false, oidc: true})     
    })

    it('should log retry fail', async function () {
      this.timeout(30000)
      console.log('      wait for log: restore (2)')
      const log = await waitLogEvent('restore', 2)
      expect(log.data.message).to.equal('connect ECONNREFUSED 127.0.0.1:3306')
    })
  })

  describe('DB restarted', function() {
    before( async function() {
      this.timeout(30000)
      console.log('      try mysql restart')
      mysql = await spawnMySQL({tag:'8.0.24'})
      console.log('      ✔ mysql restarted')
    })

    it('should return state "available"', async function () {
      this.timeout(60000)
      console.log('      wait for log: statechanged')
      const log = await waitLogEvent('statechanged')
      expect(log.data.currentState).to.equal('available')
      expect(log.data.previousState).to.equal('unavailable')
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
})

describe('DB outage: network/host down', function () {
  let api
  let mysql
  let kc

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
    kc = spawnHttpServer({port:'8080'})
    console.log('    try mysql start')
    mysql = await spawnMySQL({tag:'8.0.24', port: 3307})
    console.log('    ✔ mysql started')
    console.log('    try api start')
    api = await spawnApiPromise({
      resolveOnType: 'started',
      resolveOnClose: false,
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_HOST: '127.0.0.1',
        STIGMAN_DB_PORT: '3307',
        STIGMAN_OIDC_PROVIDER: `http://127.0.0.1:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'true'
      }
    })
    console.log('    ✔ api started')
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    console.log('    mysql killed')
    kc.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('Network/host up', function () {
    it('should return state "available"', async function () {
      this.timeout(20000)
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })

  describe('Network/host down', function () {
    before(async function () {
      execIpTables('-A OUTPUT -p tcp --dport 3307 -j DROP')
      console.log('      iptables dropping packets')
    })
    it('should return state "unavailable"', async function () {
      this.timeout(30000)
      console.log('      wait for log: statechanged')
      const log = await waitLogEvent('statechanged')
      expect(log.data.currentState).to.equal('unavailable')
      expect(log.data.previousState).to.equal('available')
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('unavailable')
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
      execIpTables('-D OUTPUT -p tcp --dport 3307 -j DROP')
      console.log('      iptables accepting packets')
    })

    it('should return state "available"', async function () {
      this.timeout(60000)
      console.log('      wait for log: statechanged')
      const log = await waitLogEvent('statechanged')
      expect(log.data.currentState).to.equal('available')
      expect(log.data.previousState).to.equal('unavailable')
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
})