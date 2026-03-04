import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import { expect } from 'chai'

const user = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe('ReviewAging', function () {
  const collectionId = '21'
  const taskName = 'review-aging'

  before(async function () {
    await utils.loadAppData()
  })

  describe('Config CRUD', function () {
    afterEach(async function () {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'DELETE', user.token)
    })

    it('GET should return 204 when no config exists', async function () {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'GET', user.token)
      expect(res.status).to.eql(204)
    })

    it('PUT should create a config and GET should return it', async function () {
      const configBody = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 86400,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      const putRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, configBody)
      expect(putRes.status).to.eql(200)
      expect(putRes.body).to.be.an('array').with.length(1)
      expect(putRes.body[0]).to.have.property('triggerField', 'touchTs')

      const getRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'GET', user.token)
      expect(getRes.status).to.eql(200)
      expect(getRes.body).to.be.an('array').with.length(1)
      expect(getRes.body[0]).to.have.property('triggerAction', 'update')
    })

    it('PUT should upsert an existing config', async function () {
      const configBody1 = [{
        triggerField: 'ts',
        triggerBasis: 'now',
        triggerInterval: 100,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, configBody1)

      const configBody2 = [{
        triggerField: 'statusTs',
        triggerBasis: 'now',
        triggerInterval: 200,
        triggerAction: 'delete',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: false
      }]
      const putRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, configBody2)
      expect(putRes.status).to.eql(200)
      expect(putRes.body[0]).to.have.property('triggerField', 'statusTs')
      expect(putRes.body[0]).to.have.property('triggerInterval', 200)
    })

    it('DELETE should remove the config', async function () {
      const configBody = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 86400,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, configBody)

      const delRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'DELETE', user.token)
      expect(delRes.status).to.eql(204)

      const getRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'GET', user.token)
      expect(getRes.status).to.eql(204)
    })
  })

  describe('Task Execution - Updates', function () {
    before(async function () {
      await utils.loadAppData()
    })

    afterEach(async function () {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'DELETE', user.token)
      await deleteTestJobs()
    })

    it('should complete cleanly when no collections have config', async function () {
      this.timeout(120_000)

      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'DELETE', user.token)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')
    })

    it('should skip disabled rules', async function () {
      this.timeout(120_000)

      const beforeRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews`,
        'GET', user.token)
      const totalBefore = beforeRes.body.length

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'delete',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: false
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      const afterRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews`,
        'GET', user.token)
      expect(afterRes.body.length).to.eql(totalBefore)
    })

    it('should apply benchmark filter correctly', async function () {
      this.timeout(120_000)

      const beforeRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews`,
        'GET', user.token)
      const totalBefore = beforeRes.body.length

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: ['VPN_SRG_TEST'] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      const afterRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews`,
        'GET', user.token)
      expect(afterRes.body.length).to.eql(totalBefore)
    })

    it('should create review history records after aging update', async function () {
      this.timeout(120_000)

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [42], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      // Get reviews for asset 42 to find a ruleId
      const reviewsRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42`,
        'GET', user.token)
      expect(reviewsRes.status).to.eql(200)
      expect(reviewsRes.body.length).to.be.greaterThan(0)

      // Use single-review endpoint with history projection
      const ruleId = reviewsRes.body[0].ruleId
      const detailRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42/${ruleId}?projection=history`,
        'GET', user.token)
      expect(detailRes.status).to.eql(200)
      expect(detailRes.body.history).to.be.an('array')
      expect(detailRes.body.history.length).to.be.greaterThan(0)
    })

    it('should show collection output only in collection endpoint, not in job output', async function () {
      this.timeout(120_000)

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [42], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      // App Manager view: should only have generic messages
      const jobOutputRes = await utils.executeRequest(
        `${config.baseUrl}/jobs/runs/${runId}/output?elevate=true`,
        'GET', user.token)
      expect(jobOutputRes.status).to.eql(200)
      for (const entry of jobOutputRes.body) {
        expect(entry).to.not.have.property('collectionId')
      }

      // Collection Owner view: should have collection-specific output
      const collOutputRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/output`,
        'GET', user.token)
      expect(collOutputRes.status).to.eql(200)
      expect(collOutputRes.body).to.be.an('array')
      expect(collOutputRes.body.length).to.be.greaterThan(0)
      const hasRuleMessage = collOutputRes.body.some(entry => entry.message.includes('rule '))
      expect(hasRuleMessage).to.be.true
    })

    it('should set result to notReviewed for matching reviews', async function () {
      this.timeout(120_000)

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'update',
        updateField: 'result',
        updateValue: 'notReviewed',
        updateFilter: { assetIds: [42], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      const reviewsRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42`,
        'GET', user.token)
      for (const review of reviewsRes.body) {
        expect(review.result).to.eql('notchecked')
      }
    })

    it('should reset status to saved for all reviews when triggerInterval=0', async function () {
      this.timeout(120_000)

      const beforeRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews?status=submitted`,
        'GET', user.token)
      expect(beforeRes.body.length).to.be.greaterThan(0)

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'update',
        updateField: 'status',
        updateValue: 'saved',
        updateFilter: { assetIds: [], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      const afterRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews?status=submitted`,
        'GET', user.token)
      expect(afterRes.body.length).to.eql(0)
    })
  })

  describe('Task Execution - Delete with assetId filter', function () {
    before(async function () {
      await utils.loadAppData()
    })

    afterEach(async function () {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'DELETE', user.token)
      await deleteTestJobs()
    })

    it('should delete reviews matching assetId filter', async function () {
      this.timeout(120_000)

      const beforeRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42`,
        'GET', user.token)
      expect(beforeRes.body.length).to.be.greaterThan(0)

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'delete',
        updateFilter: { assetIds: [42], labelIds: [], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      const afterRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42`,
        'GET', user.token)
      expect(afterRes.body.length).to.eql(0)
    })
  })

  describe('Task Execution - Delete with label filter', function () {
    before(async function () {
      await utils.loadAppData()
    })

    afterEach(async function () {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'DELETE', user.token)
      await deleteTestJobs()
    })

    it('should apply label filter correctly', async function () {
      this.timeout(120_000)

      // lvl1Label is assigned to asset 42 only
      const lvl1Label = '5130dc84-9a68-11ec-b1bc-0242ac110002'

      const labeledBeforeRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42`,
        'GET', user.token)
      expect(labeledBeforeRes.body.length).to.be.greaterThan(0)

      const unlabeledBeforeRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/29`,
        'GET', user.token)
      const unlabeledBefore = unlabeledBeforeRes.body.length

      const agingConfig = [{
        triggerField: 'touchTs',
        triggerBasis: 'now',
        triggerInterval: 0,
        triggerAction: 'delete',
        updateFilter: { assetIds: [], labelIds: [lvl1Label], benchmarkIds: [] },
        updateUserId: 0,
        enabled: true
      }]
      await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/tasks/${taskName}/config`,
        'PUT', user.token, agingConfig)

      const runId = await runImmediateTask("ReviewAging")
      const state = await waitForRunFinish(runId, 60)
      expect(state).to.eql('completed')

      const labeledAfterRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/42`,
        'GET', user.token)
      expect(labeledAfterRes.body.length).to.eql(0)

      const unlabeledAfterRes = await utils.executeRequest(
        `${config.baseUrl}/collections/${collectionId}/reviews/29`,
        'GET', user.token)
      expect(unlabeledAfterRes.body.length).to.eql(unlabeledBefore)
    })
  })
})

async function runImmediateTask(taskname) {
  const taskRes = await utils.executeRequest(`${config.baseUrl}/jobs/tasks?elevate=true`, 'GET', user.token)
  const task = taskRes.body.find(t => t.name === taskname)
  expect(task).to.exist
  const taskId = task.taskId
  const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
    name: "Test Job to Run " + taskname,
    tasks: [taskId]
  })
  const jobId = createJobRes.body.jobId

  const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}/runs?elevate=true`, 'POST', user.token)
  expect(runRes.status).to.eql(200)
  expect(runRes.body).to.have.property('runId')
  return runRes.body.runId
}

async function deleteTestJobs() {
  const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'GET', user.token)
  for (let job of res.body) {
    if (job.name.startsWith('Test Job')) {
      await utils.executeRequest(`${config.baseUrl}/jobs/${job.jobId}?elevate=true`, 'DELETE', user.token)
    }
  }
}

async function waitForRunFinish(runId, timeoutSeconds = 30) {
  let attempts = 0
  await new Promise(resolve => setTimeout(resolve, 1000))
  while (attempts < timeoutSeconds) {
    const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/${runId}?elevate=true`, 'GET', user.token)
    expect(runRes.status).to.eql(200)
    if (['completed', 'failed'].includes(runRes.body.state)) {
      if (runRes.body.state === 'failed') {
        const outputRes = await utils.executeRequest(
          `${config.baseUrl}/jobs/runs/${runId}/output?elevate=true`, 'GET', user.token)
        console.log('Task run failed. Output:', JSON.stringify(outputRes.body, null, 2))
      }
      return runRes.body.state
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
  }
  return 'timeout'
}
