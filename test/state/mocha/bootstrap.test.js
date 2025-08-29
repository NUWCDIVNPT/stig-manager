import { expect } from 'chai'
import { getPorts, spawnApiPromise, spawnMySQL, simpleRequest, waitChildClose } from './lib.js'
import MockOidc from '../../utils/mockOidc.js'
import addContext from 'mochawesome/addContext.js'

const {apiPort, dbPort, oidcPort, apiOrigin} = getPorts(54000)

describe('Boot with no dependencies', function () {
  let api
  const STIGMAN_DEPENDENCY_RETRIES = 2
  
  before(async function () {
    this.timeout(60000)
    api = await spawnApiPromise({
      resolveOnType: 'listening',
      env:{
        STIGMAN_DEPENDENCY_RETRIES,
        STIGMAN_API_PORT: apiPort,
      }
    })
  })

  after(async function () {
    await api.stop()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('GET /op/state', function () {
    it('should return state "starting"', async function () {
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 503 when dependencies are not available', async function () {
      const res = await simpleRequest(`${apiOrigin}/api/op/configuration`)
      expect(res.status).to.equal(503)
      expect(res.body.currentState).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
  })

  describe('exit code', function () {
    it('should exit after all retries', async function () {
      this.timeout(STIGMAN_DEPENDENCY_RETRIES * 6000)
      await waitChildClose(api.process)
    })
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('db', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
    it('auth', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'auth' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('auth', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'auth' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('state-changed message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'state-changed')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'fail', previousState: 'starting', dependencyStatus: {db: false, oidc: false}})
    })
  })
})

describe('Boot with both dependencies', function () {
  let api
  let mysql
  let oidc
   
  before(async function () {
    this.timeout(60000)
    console.log('    try oidc start')
    oidc = new MockOidc({keyCount: 1, includeInsecureKid: false})
    await oidc.start({port: oidcPort})
    console.log('    ✔ oidc started')
    console.log('    try mysql start')
    mysql = await spawnMySQL({tag:'8.0.24', port:dbPort})
    console.log('    ✔ mysql started')
    console.log('    try api start')
    api = await spawnApiPromise({
      resolveOnType: 'started',
      env: {
        STIGMAN_API_PORT: apiPort,
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: dbPort,
        STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`,
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

  describe('GET /op/state', function () {
    it('should return state "available"', async function () {
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 200 when dependencies are available', async function () {
      const res = await simpleRequest(`${apiOrigin}/api/op/configuration`)
      expect(res.status).to.equal(200)
    })
  })

  describe('dependency failure count', function () {
    it('db', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
    it('auth', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'auth' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
    it('auth', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'auth' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('state-changed message', function () {
    it('currentState = "available"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'state-changed')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'available', previousState: 'starting', dependencyStatus: {db: true, oidc: true}})
    })
  })
})

describe('Boot with old mysql', function () {
  let api
  let mysql
  let oidc

  before(async function () {
    this.timeout(60000)
    oidc = new MockOidc({keyCount: 1, includeInsecureKid: false})
    await oidc.start({port: oidcPort})
    mysql = await spawnMySQL({tag:'8.0.23', port:dbPort})
    api = await spawnApiPromise({
      resolveOnClose: true,
      env:{
        STIGMAN_API_PORT: apiPort,
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: dbPort,
        STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`
      }
    })
  })

  after(async function () {
    await api.stop()
    await mysql.stop()
    await oidc.stop()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('exit code', function () {
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('db, check message', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(1)
      expect(failures[0].data.message).to.equal('MySQL release 8.0.23 is too old. Update to release 8.0.24 or later.')
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('state-changed message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'state-changed')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data.currentState).to.eql('fail')
    })
  })
})

describe('Boot with insecure kid - allow insecure tokens false', function () {
  let api
  let mysql
  let oidc
   
  before(async function () {
    this.timeout(60000)
    oidc = new MockOidc({keyCount: 0, includeInsecureKid: true})
    await oidc.start({port: oidcPort})
    mysql = await spawnMySQL({tag:'8.0.24', port:dbPort})
    api = await spawnApiPromise({
      resolveOnClose: true,
      env: {
        STIGMAN_API_PORT: apiPort,
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: dbPort,
        STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'false'
      }
    })
  })

  after(async function () {
    await api.stop()
    await mysql.stop()
    await oidc.stop()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('exit code', function () {
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('auth, check message', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'auth' && r.data.success === false)
      expect(failures).to.have.lengthOf(1)
      expect(failures[0].data.message).to.include('insecure_kid -')
    })
  })

  describe('dependency success count', function () {
    it('auth', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'auth' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('state-changed message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'state-changed')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.deep.include({currentState: 'fail', previousState: 'starting'})
    })
  })
})

describe('Boot without insecure kid - request with insecure token' , function () {
  let api
  let mysql
  let oidc
  let insecureToken
   
  before(async function () {
    this.timeout(60000)
    oidc = new MockOidc({keyCount: 0, includeInsecureKid: true})
    insecureToken = oidc.getToken({username: 'insecure'})
    oidc.rotateKeys({keyCount: 1, includeInsecureKid: false})
    await oidc.start({port: oidcPort})
    mysql = await spawnMySQL({tag:'8.0.24', port:dbPort})
    api = await spawnApiPromise({
      resolveOnType: 'started',
      env: {
        STIGMAN_API_PORT: apiPort,
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: dbPort,
        STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'false'
      }
    })
  })

  after(async function () {
    await api.stop()
    await mysql.stop()
    await oidc.stop()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('GET /op/state', function () {
    it('should return state "available"', async function () {
      const res = await simpleRequest(`${apiOrigin}/api/op/state`)
      expect(res.status).to.equal(200)
      expect(res.body.currentState).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
  
  describe('GET /user with insecure kid', function () {
    it('should fail request with insecure kid', async () => {
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${insecureToken}`,
          'Content-Type': 'application/json'
        }
      }
      const res = await fetch(`${apiOrigin}/api/user`, options)
      expect(res.status).to.eql(401)
      const responseBody = await res.json()
      expect(responseBody).to.have.property('error')
        .that.equals('Insecure token presented and STIGMAN_DEV_ALLOW_INSECURE_TOKENS is false.')
      expect(responseBody).to.have.property('detail')
        .that.includes('Insecure kid found:')
    })
  })

})

describe('Boot with STIGMAN_JWKS_CACHE_MAX_AGE out of range', function () {
  let api
  let mysql
  let oidc
   
  before(async function () {
    this.timeout(60000)
    oidc = new MockOidc({keyCount: 1, includeInsecureKid: false})
    await oidc.start({port: oidcPort})
    mysql = await spawnMySQL({tag:'8.0.24', port:dbPort})
  })

  after(async function () {
    await mysql.stop()
    await oidc.stop()
    await api.stop()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('Mimimum value enforced', function () {
    before(async function () {
      this.timeout(60000)
      api = await spawnApiPromise({
        resolveOnType: 'started',
        env: {
          STIGMAN_DEPENDENCY_RETRIES: 2,
          STIGMAN_DB_PASSWORD: 'stigman',
          STIGMAN_DB_PORT: dbPort,
          STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`,
          STIGMAN_JWKS_CACHE_MAX_AGE: 0
        }
      })
    })
    after(async function () {
      await api.stop()
    })
    it('should return minimum oauth.maxCacheAge (1)', async function () {
      const configLog = api.logRecords.filter(r => r.type === 'configuration')[0]
      expect(configLog.data.oauth.cacheMaxAge).to.eql(1)
    })
  })

  describe('Maximum value enforced', function () {
    before(async function () {
      this.timeout(60000)
      api = await spawnApiPromise({
        resolveOnType: 'started',
        env: {
          STIGMAN_DEPENDENCY_RETRIES: 2,
          STIGMAN_DB_PASSWORD: 'stigman',
          STIGMAN_DB_PORT: dbPort,
          STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`,
          STIGMAN_JWKS_CACHE_MAX_AGE: 36000
        }
      })
    })
    after(async function () {
      await api.stop()
    })
    it('should return maximum oauth.maxCacheAge (35791)', async function () {
      const configLog = api.logRecords.filter(r => r.type === 'configuration')[0]
      expect(configLog.data.oauth.cacheMaxAge).to.eql(35791)
    })
  })

  describe('Handle non-number', function () {
    before(async function () {
      this.timeout(60000)
      api = await spawnApiPromise({
        resolveOnType: 'started',
        env: {
          STIGMAN_DEPENDENCY_RETRIES: 2,
          STIGMAN_DB_PASSWORD: 'stigman',
          STIGMAN_DB_PORT: dbPort,
          STIGMAN_OIDC_PROVIDER: `http://localhost:${oidcPort}`,
          STIGMAN_JWKS_CACHE_MAX_AGE: '2gether4ever'
        }
      })
    })
    after(async function () {
      await api.stop()
    })
    it('should return default oauth.maxCacheAge (10)', async function () {
      const configLog = api.logRecords.filter(r => r.type === 'configuration')[0]
      expect(configLog.data.oauth.cacheMaxAge).to.eql(10)
    })
  })

}) 