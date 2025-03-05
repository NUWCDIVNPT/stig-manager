import { expect } from 'chai'
import { spawnApiPromise, spawnHttpServer, spawnMySQL, simpleRequest, waitChildClose } from './lib.js'
import {config } from '../../api/mocha/testConfig.js'
const adminToken = config.adminToken
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
import addContext from 'mochawesome/addContext.js'

describe('Boot with no dependencies', function () {
  let api
  const STIGMAN_DEPENDENCY_RETRIES = 2
  
  before(async function () {
    this.timeout(60000)
    api = await spawnApiPromise({
      resolveOnType: 'listening',
      env:{
        STIGMAN_DEPENDENCY_RETRIES
      }
    })
  })

  after(function () {
    api.process.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('GET /op/state', function () {
    it('should return state "starting"', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('starting')
      expect(res.body.dependencies).to.eql({db: false, oidc: false})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 503 when dependencies are not available', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(503)
      expect(res.body.state).to.equal('starting')
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
    it('oidc', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(STIGMAN_DEPENDENCY_RETRIES)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'fail', previousState: 'starting', dependencyStatus: {db: false, oidc: false}})
    })
  })
})

describe('Boot with both dependencies', function () {
  let api
  let mysql
  let kc
   
  before(async function () {
    this.timeout(60000)
    kc = spawnHttpServer({port:'8080'})
    mysql = await spawnMySQL({tag:'8.0.24'})
    api = await spawnApiPromise({
      resolveOnType: 'started',
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3306',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'true'
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('GET /op/state', function () {
    it('should return state "available"', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 200 when dependencies are available', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(200)
    })
  })

  describe('dependency failure count', function () {
    it('db', function () {
      const failures = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
    it('oidc', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "available"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'available', previousState: 'starting', dependencyStatus: {db: true, oidc: true}})
    })
  })
})

describe('Boot with old mysql', function () {
  let api
  let mysql
  let kc

  before(async function () {
    this.timeout(60000)
    kc = spawnHttpServer({port:'8080'})
    mysql = await spawnMySQL({tag:'8.0.23', port:'3307'})
    api = await spawnApiPromise({
      resolveOnClose: true,
      env:{
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3307',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'true'
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
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
    it('oidc', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(0)
    })
  })

  describe('dependency success count', function () {
    it('db', function () {
      const successes = api.logRecords.filter(r => r.type === 'preflight' && r.component === 'mysql' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(1)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'fail', previousState: 'starting', dependencyStatus: {db: false, oidc: true}})
    })
  })
})

describe('Boot with insecure kid in jwks - allow insecure tokens false, expect failure', function () {
  let api
  let mysql
  let kc
   
  before(async function () {
    this.timeout(60000)
    kc = spawnHttpServer({port:'8080'})
    mysql = await spawnMySQL({tag:'8.0.24', port:'3308'})
    api = await spawnApiPromise({
      resolveOnClose: true,
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3308',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'false'
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('exit code', function () {
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('oidc, check message', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(2)
      expect(failures[0].data.message).to.include('insecure_kid -')
    })
  })

  describe('dependency success count', function () {
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.deep.include({currentState: 'fail', previousState: 'starting'})
    })
  })
})

describe('Boot with no jwks_uri in config - expect fail', function () {
  let api
  let mysql
  let kc
   
  before(async function () {
    this.timeout(60000)
    const cwd = `${__dirname}/../../api/mock-keycloak-test-cases/no-jwks`
    kc = spawnHttpServer({port:'8080', cwd})    
    mysql = await spawnMySQL({tag:'8.0.24', port:'3309'})
    api = await spawnApiPromise({
      resolveOnClose: true,
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3309',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'false'
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('exit code', function () {
    it('should have exited with code 1', function () {
      expect(api.process.exitCode).to.equal(1)
    })
  })  

  describe('dependency failure count', function () {
    it('oidc, check message', function () {
      const failures = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === false)
      expect(failures).to.have.lengthOf(1)
      expect(failures[0].data.message).to.include('No jwks_uri property found')
    })
  })

  describe('dependency success count', function () {
    it('oidc', function () {
      const successes = api.logRecords.filter(r => r.type === 'discovery' && r.component === 'oidc' && r.data.success === true)
      expect(successes).to.have.lengthOf(0)
    })
  })

  describe('statechanged message', function () {
    it('currentState = "fail"', function () {
      const stateChanged = api.logRecords.filter(r => r.type === 'statechanged')
      expect(stateChanged).to.have.lengthOf(1)
      expect(stateChanged[0].data).to.eql({currentState: 'fail', previousState: 'starting', dependencyStatus: {db: false, oidc: false}})
    })
  })
})


describe('Boot with both dependencies, "secure" kid - boots, rejects request w/ token' , function () {
  let api
  let mysql
  let kc
   
  before(async function () {
    this.timeout(60000)
    const cwd = `${__dirname}/../../api/mock-keycloak-test-cases/secure-kid`
    kc = spawnHttpServer({port:'8080', cwd})
    mysql = await spawnMySQL({tag:'8.0.24', port:'3310'})
    api = await spawnApiPromise({
      resolveOnType: 'started',
      env: {
        STIGMAN_DEPENDENCY_RETRIES: 2,
        STIGMAN_DB_PASSWORD: 'stigman',
        STIGMAN_DB_PORT: '3310',
        STIGMAN_OIDC_PROVIDER: `http://localhost:8080/auth/realms/stigman`,
        STIGMAN_DEV_ALLOW_INSECURE_TOKENS: 'false'
      }
    })
  })

  after(function () {
    api.process.kill()
    mysql.kill()
    kc.kill()
    addContext(this, {title: 'api-log', value: api.logRecords})
  })

  describe('GET /op/state', function () {
    it('should return state "available"', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/state')
      expect(res.status).to.equal(200)
      expect(res.body.state).to.equal('available')
      expect(res.body.dependencies).to.eql({db: true, oidc: true})
    })
  })
  
  describe('GET /op/configuration', function () {
    it('should return 200 when dependencies are available', async function () {
      const res = await simpleRequest('http://localhost:54000/api/op/configuration')
      expect(res.status).to.equal(200)
    })
  })

  describe('GET /user', function () {
    it('Return the requesters user information - should fail with insecure kid', async () => {
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
      const res = await fetch(`http://localhost:54000/api/user`, options)
      expect(res.status).to.eql(403)
      const responseBody = await res.json()
      expect(responseBody).to.have.property('error')
        .that.equals('Insecure token presented and STIGMAN_DEV_ALLOW_INSECURE_TOKENS is false.')
      expect(responseBody).to.have.property('detail')
        .that.includes('Insecure kid found:')
    })
  })

})