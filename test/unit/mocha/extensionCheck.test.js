import { expect } from 'chai'
import { EventEmitter } from 'node:events'
import extensionCheck from '../../../api/source/bootstrap/extensionCheck.js'
import eventBus from '../../../api/source/utils/eventBus.js'
import config from '../../../api/source/utils/config.js'

// on-finished recognizes a response as finished when it is a stream that has
// emitted 'finish', or when res.finished/writableEnded is already true. A
// minimal EventEmitter with the right shape is enough to drive it.
//
// finish() is async because on-finished does not invoke its callback during
// the 'finish' emit — it defers so the response is fully settled first. A
// synchronous assertion after finish() would always see zero events, so tests
// await it and let the pending callback run.
function makeRes (statusCode = 200) {
  const res = new EventEmitter()
  res.statusCode = statusCode
  res.finished = false
  res.writableEnded = false
  res.socket = new EventEmitter()
  res.finish = async function () {
    res.finished = true
    res.writableEnded = true
    res.emit('finish')
    await new Promise(resolve => setImmediate(resolve))
  }
  return res
}

// xEvent is synthetic — no published operation carries one in this iteration.
function makeReq (xEvent) {
  const schema = { operationId: 'replaceCollection' }
  if (xEvent) schema['x-event'] = xEvent
  return {
    requestId: 'req-1',
    userObject: { userId: '42', username: 'lvasquez' },
    access_token: { azp: 'stig-manager' },
    openapi: { pathParams: { collectionId: '5' }, schema },
    query: {},
    body: { name: 'NCCM' }
  }
}

// A stand-in operation handler; extensionCheck is invoked bound to it.
function controller (req, res, next) { res.controllerRan = true }

describe('extensionCheck event hook registration', function () {
  let received = []
  const handler = env => received.push(env)

  beforeEach(function () {
    received = []
    eventBus.on(handler)
  })
  afterEach(function () {
    eventBus.off(handler)
    config.events.enabled = true
  })

  it('emits an event for an annotated operation when the response finishes', async function () {
    const req = makeReq({ resource: 'collection', action: 'update' })
    const res = makeRes(200)
    extensionCheck.call(controller, req, res, () => {})
    expect(res.controllerRan).to.equal(true)
    expect(received).to.have.lengthOf(0) // nothing until the response finishes
    await res.finish()
    expect(received).to.have.lengthOf(1)
    expect(received[0].resource).to.equal('collection')
    expect(received[0].action).to.equal('update')
  })

  it('registers no hook for an unannotated operation', async function () {
    const res = makeRes(200)
    extensionCheck.call(controller, makeReq(null), res, () => {})
    expect(res.controllerRan).to.equal(true)
    await res.finish()
    expect(received).to.have.lengthOf(0)
  })

  it('registers no hook when events are disabled', async function () {
    config.events.enabled = false
    const res = makeRes(200)
    extensionCheck.call(controller, makeReq({ resource: 'collection', action: 'update' }), res, () => {})
    expect(res.controllerRan).to.equal(true)
    await res.finish()
    expect(received).to.have.lengthOf(0)
  })

  it('does not emit for a failed annotated request', async function () {
    const res = makeRes(403)
    extensionCheck.call(controller, makeReq({ resource: 'collection', action: 'update' }), res, () => {})
    await res.finish()
    expect(received).to.have.lengthOf(0)
  })
})

describe('extensionCheck elevation behavior is unchanged', function () {
  it('rejects an elevation-required operation without elevate', function () {
    const req = makeReq(null)
    req.openapi.schema['x-elevation-required'] = true
    req.query = { elevate: false }
    const res = makeRes()
    let err
    extensionCheck.call(controller, req, res, e => { err = e })
    expect(err).to.exist
    expect(err.name).to.equal('ElevationError')
    expect(res.controllerRan).to.equal(undefined)
  })

  it('invokes the handler for an elevation-required operation with elevate', function () {
    const req = makeReq(null)
    req.openapi.schema['x-elevation-required'] = true
    req.query = { elevate: true }
    const res = makeRes()
    extensionCheck.call(controller, req, res, () => {})
    expect(res.controllerRan).to.equal(true)
  })

  it('does not register an event hook when elevation is rejected', async function () {
    const received = []
    const handler = env => received.push(env)
    eventBus.on(handler)
    const req = makeReq({ resource: 'job', action: 'create' })
    req.openapi.schema['x-elevation-required'] = true
    req.query = { elevate: false }
    const res = makeRes(403)
    extensionCheck.call(controller, req, res, () => {})
    await res.finish()
    eventBus.off(handler)
    expect(received).to.have.lengthOf(0)
  })
})
