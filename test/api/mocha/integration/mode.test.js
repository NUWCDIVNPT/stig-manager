import * as utils from '../utils/testUtils.js'
import { config } from '../testConfig.js'
import { expect, use } from 'chai'
import chaiDateTime from 'chai-datetime'
use(chaiDateTime)

const admin = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe(`POST - setMode - /op/state/mode`, () => {
  it(`should not set the mode when not elevated`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode?elevate=false`,
      'POST',
      admin.token,
      {
        mode: `maintenance`,
        message: `test message`,
      })

    expect(res.status).to.equal(403)
  })

  it(`should not set the mode to the current mode`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode?elevate=true`,
      'POST',
      admin.token,
      {
        mode: `normal`,
        message: `test message`,
      })

    expect(res.status).to.equal(422)
  })

  it(`should prohibit /op/maintenance/socket when in normal mode`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/maintenance/socket?elevate=true`,
      'GET',
      admin.token
    )
    expect(res.status).to.equal(409)
  })

  it(`should set the mode to maintenance`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode?elevate=true`,
      'POST',
      admin.token,
      {
        mode: `maintenance`,
        message: `test message`,
      })

    expect(res.status).to.equal(200)
    expect(res.body.mode.currentMode).to.equal(`maintenance`)
    expect(res.body.mode.message).to.equal(`test message`)
  })

  it(`should allow /op/maintenance/socket when in maintenance mode`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/maintenance/socket?elevate=true`,
      'GET',
      admin.token
    )
    expect(res.status).to.equal(204)
  })

  it(`should allow GET /user when in maintenance mode`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/user`,
      'GET',
      admin.token
    )
    expect(res.status).to.equal(200)
  })

  it(`should prohibit POST /collections when in maintenance mode`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/collections`,
      'POST',
      admin.token,
      {
        name: 'test-collection',
        grants: []
      }
    )
    expect(res.status).to.equal(409)
  })

  it(`should set the mode to normal`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode?elevate=true`,
      'POST',
      admin.token,
      {
        mode: `normal`,
        message: `test message`,
      })

    expect(res.status).to.equal(200)
    expect(res.body.mode.currentMode).to.equal(`normal`)
    expect(res.body.mode.message).to.equal(`test message`)
  })

})

describe('POST - DELETE - scheduleModeChange - /op/state/mode/schedule', () => {
  after(async function () {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode?elevate=true`,
      'POST',
      admin.token,
      {
        mode: `normal`,
        message: `test message`,
      })
    expect(res.status).to.equal(200)
  })

  it(`should schedule a mode change`, async () => {
    const nextMessage = `mode message`
    const scheduledMessage = `scheduled message`
    const scheduleIn = 60 // seconds
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode/schedule?elevate=true`,
      'POST',
      admin.token,
      {
        nextMode: `maintenance`,
        nextMessage,
        scheduleIn,
        scheduledMessage
      }
    )
    expect(res.status).to.equal(200)
    expect(res.body.mode.scheduled.nextMode).to.equal(`maintenance`)
    expect(res.body.mode.scheduled.nextMessage).to.equal(nextMessage)
    expect(res.body.mode.scheduled.scheduledMessage).to.equal(scheduledMessage)
    expect(new Date(res.body.mode.scheduled.scheduledFor)).to.be.closeToTime(new Date(Date.now() + scheduleIn * 1000), 1000)
  })

  it(`should reschedule a mode change`, async () => {
    const nextMessage = `mode message`
    const scheduledMessage = `scheduled message`
    const scheduleIn = 60 // seconds
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode/schedule?elevate=true`,
      'POST',
      admin.token,
      {
        nextMode: `maintenance`,
        nextMessage,
        scheduleIn,
        scheduledMessage
      }
    )
    expect(res.status).to.equal(200)
    expect(res.body.mode.scheduled.nextMode).to.equal(`maintenance`)
    expect(res.body.mode.scheduled.nextMessage).to.equal(nextMessage)
    expect(res.body.mode.scheduled.scheduledMessage).to.equal(scheduledMessage)
    expect(new Date(res.body.mode.scheduled.scheduledFor)).to.be.closeToTime(new Date(Date.now() + scheduleIn * 1000), 1000)
  })

  it(`should delete a scheduled mode change`, async () => {
    const res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode/schedule?elevate=true`,
      'DELETE',
      admin.token
    )
    expect(res.status).to.equal(200)
    expect(res.body.mode).to.not.have.property('scheduled')
  })

  it(`should execute a scheduled mode change`, async function () {
    const nextMessage = `mode message`
    const scheduledMessage = `scheduled message`
    const scheduleIn = 5 // seconds
    let res = null
    res = await utils.executeRequest(
      `${config.baseUrl}/op/state/mode/schedule?elevate=true`,
      'POST',
      admin.token,
      {
        nextMode: `maintenance`,
        nextMessage,
        scheduleIn,
        scheduledMessage
      }
    )
    expect(res.status).to.equal(200)

    await utils.wait(7000) // wait 7 seconds to ensure the mode change has executed

    res = await utils.executeRequest(
      `${config.baseUrl}/op/state`,
      'GET',
      admin.token
    )
    expect(res.status).to.equal(200)
    expect(res.body.mode.currentMode).to.equal(`maintenance`)
    expect(res.body.mode.message).to.equal(nextMessage)
    expect(res.body.mode).to.not.have.property('scheduled')
  })
})



