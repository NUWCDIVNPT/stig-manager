import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

// admin: Application Manager + Owner grant on testCollection (collectionId=21)
const admin = {
  name: 'admin',
  grant: 'Owner',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44'
}

// lvl3: Manage grant (roleId=3) on testCollection (collectionId=21), no Application Manager role
const lvl3 = {
  name: 'lvl3',
  grant: 'Manage',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDkxMjUsImlhdCI6MTY3MDU2ODMyNSwiYXV0aF90aW1lIjoxNjcwNTY4MzI1LCJqdGkiOiI4NTI5MjZmZi0xYzM4LTQwMDYtOTYwYi1kOWE0YmNhMjcxZjkiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiIzNWZhYmMwNi0wNzZlLTRmZjQtOGJkZS1mMzI1ZWE3ZGQ0ZmIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjQxNmMwYmJkLTJmNjktNGZkMC04MmE1LTdjZDBmNmRlNzUzNSIsInNlc3Npb25fc3RhdGUiOiIzMThkOGNmZi0wY2U1LTQ3MzktODEyYy1iNWI0NjdlMWQ2YzEiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6IjMxOGQ4Y2ZmLTBjZTUtNDczOS04MTJjLWI1YjQ2N2UxZDZjMSIsInByZWZlcnJlZF91c2VybmFtZSI6Imx2bDMifQ.KduimV7h4DSySAWBbWlpN1xwbfXBfNsscvx2qIx9SVAeZFSGbPZ0JtgThD9uray9xZjrk6qLNYnkoVyYQLS4M-pg8IlFp5yKJBCIeCpcTxA25MdV5VwZQcCD9pgwtEav-cgaDD2Ue6cHj_02cQGMClsfkJ2SuOUJ9nIu4B3m3Qk'
}

// lvl1: Restricted grant (roleId=1) on testCollection (collectionId=21)
const lvl1 = {
  name: 'lvl1',
  grant: 'Restricted',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
}

const collectionId = reference.testCollection.collectionId
const taskId = 5
const baseConfigUrl = `${config.baseUrl}/collections/${collectionId}/tasks/${taskId}/config`
const baseOutputUrl = `${config.baseUrl}/collections/${collectionId}/tasks/${taskId}/output`

const sampleConfig = [
  {
    triggerField: 'ts',
    triggerBasis: 'now',
    triggerInterval: 86400,
    triggerAction: 'update',
    updateField: 'status',
    updateValue: 'saved',
    updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
    enabled: true
  }
]

describe('Collection Task Config - /collections/{collectionId}/tasks/{taskId}/config', function () {

  beforeEach(async function () {
    await utils.loadAppData()
  })

  afterEach(async function () {
    // Clean up any config set during tests
    await utils.executeRequest(baseConfigUrl, 'DELETE', admin.token)
  })

  describe('GET getCollectionTaskConfig', function () {
    it('should return 404 when no config exists', async function () {
      const res = await utils.executeRequest(baseConfigUrl, 'GET', admin.token)
      expect(res.status).to.eql(404)
    })

    it('should return config after PUT', async function () {
      await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, sampleConfig)
      const res = await utils.executeRequest(baseConfigUrl, 'GET', admin.token)
      expect(res.status).to.eql(200)
      expect(res.body).to.be.an('array').with.length(1)
      expect(res.body[0]).to.have.property('triggerField', 'ts')
      expect(res.body[0]).to.have.property('enabled', true)
    })

    it('should allow Manage grant user to GET config', async function () {
      await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, sampleConfig)
      const res = await utils.executeRequest(baseConfigUrl, 'GET', lvl3.token)
      expect(res.status).to.eql(200)
    })

    it('should deny Restricted grant user GET config (403)', async function () {
      const res = await utils.executeRequest(baseConfigUrl, 'GET', lvl1.token)
      expect(res.status).to.eql(403)
    })
  })

  describe('PUT putCollectionTaskConfig', function () {
    it('should set config and return it', async function () {
      const res = await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, sampleConfig)
      expect(res.status).to.eql(200)
      expect(res.body).to.be.an('array').with.length(1)
      expect(res.body[0]).to.have.property('triggerField', 'ts')
      expect(res.body[0]).to.have.property('triggerBasis', 'now')
      expect(res.body[0]).to.have.property('triggerInterval', 86400)
      expect(res.body[0]).to.have.property('triggerAction', 'update')
      expect(res.body[0]).to.have.property('updateField', 'status')
      expect(res.body[0]).to.have.property('updateValue', 'saved')
      expect(res.body[0]).to.have.property('enabled', true)
    })

    it('should overwrite config on second PUT', async function () {
      await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, sampleConfig)
      const newConfig = [
        {
          triggerField: 'statusTs',
          triggerBasis: 'now',
          triggerInterval: 3600,
          triggerAction: 'delete',
          updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
          enabled: false
        }
      ]
      const res = await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, newConfig)
      expect(res.status).to.eql(200)
      expect(res.body[0]).to.have.property('triggerField', 'statusTs')
      expect(res.body[0]).to.have.property('enabled', false)

      const getRes = await utils.executeRequest(baseConfigUrl, 'GET', admin.token)
      expect(getRes.body[0]).to.have.property('triggerInterval', 3600)
    })

    it('should deny Manage grant user PUT config (403)', async function () {
      const res = await utils.executeRequest(baseConfigUrl, 'PUT', lvl3.token, sampleConfig)
      expect(res.status).to.eql(403)
    })

    it('should return 400 for invalid triggerField', async function () {
      const invalidConfig = [{ ...sampleConfig[0], triggerField: 'invalidField' }]
      const res = await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, invalidConfig)
      expect(res.status).to.eql(400)
    })

    it('should accept a config with a fixed datetime triggerBasis', async function () {
      const configWithDatetime = [{ ...sampleConfig[0], triggerBasis: '2024-01-01T00:00:00Z' }]
      const res = await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, configWithDatetime)
      expect(res.status).to.eql(200)
      expect(res.body[0]).to.have.property('triggerBasis', '2024-01-01T00:00:00Z')
    })
  })

  describe('DELETE deleteCollectionTaskConfig', function () {
    it('should delete config and subsequent GET returns 404', async function () {
      await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, sampleConfig)
      const delRes = await utils.executeRequest(baseConfigUrl, 'DELETE', admin.token)
      expect(delRes.status).to.eql(204)

      const getRes = await utils.executeRequest(baseConfigUrl, 'GET', admin.token)
      expect(getRes.status).to.eql(404)
    })

    it('should return 404 when deleting nonexistent config', async function () {
      const res = await utils.executeRequest(baseConfigUrl, 'DELETE', admin.token)
      expect(res.status).to.eql(404)
    })

    it('should deny Manage grant user DELETE config (403)', async function () {
      await utils.executeRequest(baseConfigUrl, 'PUT', admin.token, sampleConfig)
      const res = await utils.executeRequest(baseConfigUrl, 'DELETE', lvl3.token)
      expect(res.status).to.eql(403)
    })
  })
})

describe('Collection Task Output - /collections/{collectionId}/tasks/{taskId}/output', function () {

  before(async function () {
    await utils.loadAppData()
  })

  describe('GET getCollectionTaskOutput', function () {
    it('should return empty array when no output exists', async function () {
      const res = await utils.executeRequest(baseOutputUrl, 'GET', admin.token)
      expect(res.status).to.eql(200)
      expect(res.body).to.be.an('array')
    })

    it('should return 403 for Restricted grant user', async function () {
      const res = await utils.executeRequest(baseOutputUrl, 'GET', lvl1.token)
      expect(res.status).to.eql(403)
    })

    it('should allow Manage grant user to GET output', async function () {
      const res = await utils.executeRequest(baseOutputUrl, 'GET', lvl3.token)
      expect(res.status).to.eql(200)
    })

    it('should accept start and end query parameters', async function () {
      const start = encodeURIComponent('2020-01-01T00:00:00Z')
      const end = encodeURIComponent('2030-01-01T00:00:00Z')
      const res = await utils.executeRequest(
        `${baseOutputUrl}?start=${start}&end=${end}`,
        'GET',
        admin.token
      )
      expect(res.status).to.eql(200)
      expect(res.body).to.be.an('array')
    })
  })
})
