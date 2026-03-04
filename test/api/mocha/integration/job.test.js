import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import { expect } from 'chai'

const user = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe('GET - getAllTasks - /jobs/tasks', function () {

  before(async function () {
    await utils.loadAppData()
  })

  after(async function () {
    // Clean up any jobs created during tests
    const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'GET', user.token)
    for (let job of res.body) {
      if (job.name.startsWith('Test Job')) {
        await utils.executeRequest(`${config.baseUrl}/jobs/${job.jobId}?elevate=true`, 'DELETE', user.token)
      }
    }
  })

  it('should get all tasks', async function () {
    const res = await utils.executeRequest(`${config.baseUrl}/jobs/tasks?elevate=true`, 'GET', user.token)
    expect(res.status).to.eql(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.be.greaterThan(0)
  })
})

describe('Job endpoint tests', function () {
  beforeEach(async function () {
      await utils.loadAppData()
  })

  afterEach(deleteTestJobs)

  describe('GET - getJobs - /jobs', function () { 
    it('should get all jobs', async function () {
      const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'GET', user.token)
      expect(res.status).to.eql(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.be.greaterThan(0)
    })
  })

  describe('POST - createJob - /jobs', function () {
    it('should create a job without event', async function () {
      const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job With No Event",
        tasks: ["1"],
      })
      expect(res.status).to.eql(201)
      expect(res.body).to.be.an('object')
      expect(res.body).to.have.property('jobId')
      expect(res.body).to.have.property('name', 'Test Job With No Event')
      expect(res.body).to.have.property('tasks').that.is.an('array').with.length(1)
    })

    it('should create a job with one-time event', async function () {
      const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job with Once Event",
        tasks: ["1"],
        event: {
          type: "once",
          starts: '2035-01-01T00:00:00Z',
        }
      })
      expect(res.status).to.eql(201)
      expect(res.body).to.be.an('object')
      expect(res.body).to.have.property('jobId')
      expect(res.body).to.have.property('name', 'Test Job with Once Event')
      expect(res.body).to.have.property('tasks').that.is.an('array').with.length(1)
      expect(res.body).to.have.property('event').that.is.an('object')
      expect(res.body.event).to.have.property('type', 'once')
      expect(res.body.event).to.have.property('starts')
    })

    it('should create a job with recurring event enabled', async function () {

      const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job with Recurring Event",
        tasks: ["1"],
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
        }
      })
      expect(res.status).to.eql(201)
      expect(res.body).to.be.an('object')
      expect(res.body).to.have.property('jobId')
      expect(res.body).to.have.property('name', 'Test Job with Recurring Event')
      expect(res.body).to.have.property('tasks').that.is.an('array').with.length(1)
      expect(res.body).to.have.property('event').that.is.an('object')
      expect(res.body.event).to.have.property('type', 'recurring')
      expect(res.body.event).to.have.property('interval').that.is.an('object')
      expect(res.body.event.interval).to.have.property('value', '1')
      expect(res.body.event.interval).to.have.property('field', 'day')
      expect(res.body.event).to.have.property('starts')
      expect(res.body.event).to.have.property('enabled', true)
    })
    it('should fail to create a job with non-existent task', async function () {
      const res = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job with Non-Existent Task",
        tasks: ["999999"],
      })
      expect(res.status).to.eql(422)
      expect(res.body).to.be.an('object')
      expect(res.body).to.have.property('detail', 'Unknown taskId in list')
    })
    it('should fail to create a job with duplicate name', async function () {
      const res1 = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job with Duplicate Name",
        tasks: ["1"],
      })
      expect(res1.status).to.eql(201)

      const res2 = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job with Duplicate Name",
        tasks: ["1"],
      })
      expect(res2.status).to.eql(422)
      expect(res2.body).to.be.an('object')
      expect(res2.body).to.have.property('detail', 'Job name already exists')
    })
  })

  describe('GET - getJob - /jobs/{jobId}', function () {
    it('should get a job by ID', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Get",
        tasks: ["1"]
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const getRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'GET', user.token)
      expect(getRes.status).to.eql(200)
      expect(getRes.body).to.be.an('object')
      expect(getRes.body).to.have.property('jobId', jobId)
    })
    it('should return 404 for a non-existent job ID', async function () {
      const getRes = await utils.executeRequest(`${config.baseUrl}/jobs/999999?elevate=true`, 'GET', user.token)
      expect(getRes.status).to.eql(404)
    })
  })

  describe('PATCH - patchJob - /jobs/{jobId}', function () {
    it('should patch a job to enable/disable event', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Patch",
        tasks: ["1"],
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
          enabled: true
        }
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId
      expect(createJobRes.body.event).to.have.property('enabled', true)

      // Now patch the job to disable the event
      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'PATCH', user.token, {
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
          enabled: false
        }
      })
      expect(patchRes.status).to.eql(200)
      expect(patchRes.body.event).to.have.property('enabled', false)
    })
    it('should patch a job to change name and tasks', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Patch",
        tasks: ["1"],
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
          enabled: true
        }
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'PATCH', user.token, {
        name: "Test Job Updated Name",
        tasks: ["2"]
      })
      expect(patchRes.status).to.eql(200)
      expect(patchRes.body).to.have.property('name', "Test Job Updated Name")
      expect(patchRes.body).to.have.property('tasks').that.is.an('array').with.length(1)
      expect(patchRes.body.tasks[0]).to.have.property('taskId', '2')
    })
    it('should fail to patch tasks for a system job', async function () {
      // Attempt to patch the system job with jobId 1
      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/1?elevate=true`, 'PATCH', user.token, {
        tasks: ["2"]
      })
      expect(patchRes.status).to.eql(422)
    })
    it('should fail to patch name for a system job', async function () {
      // Attempt to patch the system job with jobId 1
      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/1?elevate=true`, 'PATCH', user.token, {
        name: "Test Job Updated System Job Name"
      })
      expect(patchRes.status).to.eql(422)
    })
    it('should fail to patch description for a system job', async function () {
      // Attempt to patch the system job with jobId 1
      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/1?elevate=true`, 'PATCH', user.token, {
        description: "Updated System Job Description"
      })
      expect(patchRes.status).to.eql(422)
    })
    it('should succeed to patch event for a system job', async function () {
      // Attempt to patch the system job with jobId 2
      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/2?elevate=true`, 'PATCH', user.token, {
        event: null
      })
      expect(patchRes.status).to.eql(200)
      expect(patchRes.body.event).to.be.null
    })
    it('should fail to patch a non-existent job', async function () {
      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/999999?elevate=true`, 'PATCH', user.token, {
        name: "Test Job Updated Non-Existent Job Name"
      })
      expect(patchRes.status).to.eql(404)
    })
    it('should fail to patch a job to a duplicate name', async function () {
      let createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job for Name Collision",
        tasks: ["1"],
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
          enabled: true
        }
      })
      expect(createJobRes.status).to.eql(201)

      createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Patch",
        tasks: ["1"],
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
          enabled: true
        }
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'PATCH', user.token, {
        name: "Test Job for Name Collision",
        tasks: ["2"]
      })
      expect(patchRes.status).to.eql(422)
      expect(patchRes.body).to.be.an('object')
      expect(patchRes.body).to.have.property('detail', 'Job name already exists')
    })
    it('should fail to patch a job with non-existent task', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Patch Non-Existent Task",
        tasks: ["1"],
        event: {
          type: "recurring",
          interval: {
            value: "1",
            field: "day"
          },
          starts: '2035-01-01T00:00:00Z',
          enabled: true
        }
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const patchRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'PATCH', user.token, {
        tasks: ["999999"]
      })
      expect(patchRes.status).to.eql(422)
      expect(patchRes.body).to.be.an('object')
      expect(patchRes.body).to.have.property('detail', 'Unknown taskId in list')
    })
  })

  describe('DELETE - deleteJob - /jobs/{jobId}', function () {
    it('should delete a job', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Delete",
        tasks: ["1"],
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const deleteRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'DELETE', user.token)
      expect(deleteRes.status).to.eql(204)

      // Verify job is deleted
      const getRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}?elevate=true`, 'GET', user.token)
      expect(getRes.status).to.eql(404)
    })
    it('should fail to delete a system job', async function () {
      // Attempt to delete the system job with jobId 1
      const deleteRes = await utils.executeRequest(`${config.baseUrl}/jobs/1?elevate=true`, 'DELETE', user.token)
      expect(deleteRes.status).to.eql(422)
    })
    it('should fail to delete a non-existent job', async function () {
      const deleteRes = await utils.executeRequest(`${config.baseUrl}/jobs/999999?elevate=true`, 'DELETE', user.token)
      expect(deleteRes.status).to.eql(404)
    })
  })

  describe('POST - runJob - /jobs/{jobId}/run', function () {
    it('should run a job immediately', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Run",
        tasks: ["1"],
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}/runs?elevate=true`, 'POST', user.token)
      expect(runRes.status).to.eql(200)
      expect(runRes.body).to.have.property('runId')
    })
    it('should fail to run a non-existent job', async function () {
      const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/999999/runs?elevate=true`, 'POST', user.token)
      expect(runRes.status).to.eql(404)
    })
  })

  describe('GET - getRunsByJob - /jobs/{jobId}/runs', function () {
    it('should get runs for a job', async function () {
      this.timeout(120_000) // increase timeout for this test
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Get Runs",
        tasks: ["1"],
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      // Run the job twice
      await runImmediateJob(jobId)
      await new Promise(resolve => setTimeout(resolve, 1000)) // wait 1 second between runs to ensure different timestamps
      await runImmediateJob(jobId)

      const runsRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}/runs?elevate=true`, 'GET', user.token)
      expect(runsRes.status).to.eql(200)
      expect(runsRes.body).to.be.an('array')
      expect(runsRes.body.length).to.be.at.least(2)
      for (let run of runsRes.body) {
        expect(run).to.have.property('runId')
        expect(run).to.have.property('state')
        expect(run).to.have.property('created')
        expect(run).to.have.property('jobId', jobId)
      }
    })
    it('should return 404 for runs of a non-existent job', async function () {
      const runsRes = await utils.executeRequest(`${config.baseUrl}/jobs/999999/runs?elevate=true`, 'GET', user.token)
      expect(runsRes.status).to.eql(404)
    })
  })

  describe('GET - getRunById - /jobs/runs/{runId}', function () {
    it('should get a specific run by ID', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Get Specific Run",
        tasks: ["1"],
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const runId = await runImmediateJob(jobId)

      const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/${runId}?elevate=true`, 'GET', user.token)
      expect(runRes.status).to.eql(200)
      expect(runRes.body).to.be.an('object')
      expect(runRes.body).to.have.property('runId', runId)
      expect(runRes.body).to.have.property('state')
      expect(runRes.body).to.have.property('created')
      expect(runRes.body).to.have.property('jobId', jobId)
    })
    it('should return 404 for a non-existent run ID', async function () {
      const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/00000000-0000-0000-0000-000000000000?elevate=true`, 'GET', user.token)
      expect(runRes.status).to.eql(404)
    })
  })

  describe('DELETE - deleteRunById - /jobs/runs/{runId}', function () {
    it('should delete a specific run by ID', async function () {
      const createJobRes = await utils.executeRequest(`${config.baseUrl}/jobs?elevate=true`, 'POST', user.token, {
        name: "Test Job to Delete Specific Run",
        tasks: ["1"],
      })
      expect(createJobRes.status).to.eql(201)
      const jobId = createJobRes.body.jobId

      const runId = await runImmediateJob(jobId)
      await new Promise(resolve => setTimeout(resolve, 1000)) // wait a second to ensure run is created before attempting delete

      // Now delete the run
      const deleteRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/${runId}?elevate=true`, 'DELETE', user.token)
      expect(deleteRes.status).to.eql(204)

      // Verify run is deleted
      const getRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/${runId}?elevate=true`, 'GET', user.token)
      expect(getRes.status).to.eql(404)
    })
    it('should return 404 when deleting a non-existent run ID', async function () {
      const deleteRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/00000000-0000-0000-0000-000000000000?elevate=true`, 'DELETE', user.token)
      expect(deleteRes.status).to.eql(404)
    })
  })

}) 

describe('Task tests', function () {
  beforeEach(async function () {
      await utils.loadAppData()
  })
  afterEach(deleteTestJobs)
  describe('Task - WipeDeletedObjects', function () {

    before(async function () {
      await utils.loadAppData()
    })

    after(deleteTestJobs)

    it('should wipe deleted objects', async function () {
      const deleteRes = await utils.executeRequest(`${config.baseUrl}/assets/62`, 'DELETE', user.token)
      expect(deleteRes.status).to.eql(200)
      const appInfoRes = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true`, 'GET', user.token)
      expect(appInfoRes.status).to.eql(200)
      expect(appInfoRes.body).to.have.nested.property('collections.21.assetsDisabled', 2)
      expect(appInfoRes.body).to.have.nested.property('collections.21.reviewsDisabled', 4)
      expect(appInfoRes.body).to.have.nested.property('collections.93.state', 'disabled')

      const runId = await runImmediateTask("WipeDeletedObjects")
      const state = await waitForRunFinish(runId, 30)
      expect(state).to.eql('completed')

      const finalAppInfoRes = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true`, 'GET', user.token)
      expect(finalAppInfoRes.status).to.eql(200)
      expect(finalAppInfoRes.body).to.have.nested.property('collections.21.assetsDisabled', 0)
      expect(finalAppInfoRes.body).to.have.nested.property('collections.21.reviewsDisabled', 0)
      expect(finalAppInfoRes.body).to.not.have.nested.property('collections.93')
    })

  })

  describe('Task - DeleteUnmappedReviews', function () {

    before(async function () {
      await utils.loadAppData()
    })

    after(deleteTestJobs)

    it('should delete unmapped reviews in system context', async function () {
      const removeRes = await utils.executeRequest(`${config.baseUrl}/stigs/VPN_SRG_TEST?elevate=true&force=true`, 'DELETE', user.token)
      expect(removeRes.status).to.eql(200)
      const reviewsRes = await utils.executeRequest(`${config.baseUrl}/collections/21/reviews?rules=not-default-mapped`, 'GET', user.token)
      expect(reviewsRes.status).to.eql(200)
      expect(reviewsRes.body).to.be.an('array')
      expect(reviewsRes.body.length).to.eql(14)

      const runId = await runImmediateTask("DeleteUnmappedReviews")
      const state = await waitForRunFinish(runId, 30)
      expect(state).to.eql('completed')

      const finalReviewsRes = await utils.executeRequest(`${config.baseUrl}/collections/21/reviews?rules=not-default-mapped`, 'GET', user.token)
      expect(finalReviewsRes.status).to.eql(200)
      expect(finalReviewsRes.body).to.be.an('array')
      expect(finalReviewsRes.body.length).to.eql(0)
    })
  })

  describe('Task - DeleteUnmappedAssetReviews', function () {

    before(async function () {
      await utils.loadAppData()
    })

    after(deleteTestJobs)

    it('should delete unmapped reviews in asset context', async function () {
      const removeRes = await utils.executeRequest(`${config.baseUrl}/assets/62`, 'PATCH', user.token, {
        stigs: []
      })
      expect(removeRes.status).to.eql(200)
      const reviewsRes = await utils.executeRequest(`${config.baseUrl}/collections/21/reviews/62?rules=not-mapped`, 'GET', user.token)
      expect(reviewsRes.status).to.eql(200)
      expect(reviewsRes.body).to.be.an('array')
      expect(reviewsRes.body.length).to.eql(3)

      const runId = await runImmediateTask("DeleteUnmappedAssetReviews")
      const state = await waitForRunFinish(runId, 30)
      expect(state).to.eql('completed')

      const finalReviewsRes = await utils.executeRequest(`${config.baseUrl}/collections/21/reviews/62?rules=not-mapped`, 'GET', user.token)
      expect(finalReviewsRes.status).to.eql(200)
      expect(finalReviewsRes.body).to.be.an('array')
      expect(finalReviewsRes.body.length).to.eql(0)
    })
  })
})

async function runImmediateJob(jobId) {
  const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/${jobId}/runs?elevate=true`, 'POST', user.token)
  expect(runRes.status).to.eql(200)
  expect(runRes.body).to.have.property('runId')
  return runRes.body.runId
}

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
  await new Promise(resolve => setTimeout(resolve, 1000)) // wait 1 second before checking again
  while (attempts < timeoutSeconds) {
    const runRes = await utils.executeRequest(`${config.baseUrl}/jobs/runs/${runId}?elevate=true`, 'GET', user.token)
    expect(runRes.status).to.eql(200)
    if (['completed', 'failed'].includes(runRes.body.state)) {
      return runRes.body.state
    }
    await new Promise(resolve => setTimeout(resolve, 1000)) // wait 1 second before checking again
    attempts++
  }
  return 'timeout'
}