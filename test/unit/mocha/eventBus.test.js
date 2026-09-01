import { expect } from 'chai'
import eventBus from '../../../api/source/utils/eventBus.js'

const { shouldEmit, buildEnvelope, finishHandler, on, off } = eventBus

// A minimally realistic req/res pair, shaped as express-openapi-validator
// leaves them by the time an operation handler runs. The x-event annotation
// here is synthetic: no published operation carries one in this iteration,
// and the framework only ever reads this runtime schema object.
function makeReq (overrides = {}) {
  return {
    requestId: 'req-1',
    userObject: { userId: '42', username: 'lvasquez' },
    access_token: { azp: 'stig-manager' },
    openapi: {
      pathParams: { collectionId: '5' },
      schema: {
        operationId: 'replaceCollection',
        'x-event': { resource: 'collection', action: 'update' }
      }
    },
    query: { elevate: false },
    body: { name: 'NCCM' },
    ...overrides
  }
}

function makeRes (overrides = {}) {
  return { statusCode: 200, ...overrides }
}

describe('eventBus.shouldEmit', function () {
  it('emits for a 2xx response with no eventInfo', function () {
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 200 }))).to.equal(true)
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 201 }))).to.equal(true)
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 204 }))).to.equal(true)
  })

  it('does not emit for 4xx or 5xx with no eventInfo', function () {
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 400 }))).to.equal(false)
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 403 }))).to.equal(false)
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 500 }))).to.equal(false)
  })

  it('lets eventInfo.success override the status code in both directions', function () {
    // the case a streaming handler will need: headers committed 200, mutation failed
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 200, eventInfo: { success: false } }))).to.equal(false)
    // explicit success wins even over a non-2xx status
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 500, eventInfo: { success: true } }))).to.equal(true)
  })

  it('falls back to the status check when eventInfo omits success', function () {
    // an eventInfo carrying only params must not read as "success: undefined -> false"
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 200, eventInfo: { params: { a: 1 } } }))).to.equal(true)
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 400, eventInfo: { params: { a: 1 } } }))).to.equal(false)
  })

  it('ignores a non-boolean success', function () {
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 200, eventInfo: { success: 'yes' } }))).to.equal(true)
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 400, eventInfo: { success: 'yes' } }))).to.equal(false)
  })

  it('emits for a destroyed response when the outcome rule passes', function () {
    expect(shouldEmit(makeReq(), makeRes({ statusCode: 200, destroyed: true }))).to.equal(true)
  })
})

describe('eventBus.buildEnvelope', function () {
  it('maps the mechanical fields from req and res', function () {
    const env = buildEnvelope(makeReq(), makeRes())
    expect(env.eventId).to.be.a('string').with.length.greaterThan(0)
    expect(env.date).to.match(/^\d{4}-\d{2}-\d{2}T/)
    expect(env.requestId).to.equal('req-1')
    expect(env.actor).to.eql({
      type: 'user',
      userId: '42',
      username: 'lvasquez',
      clientId: 'stig-manager'
    })
    expect(env.resource).to.equal('collection')
    expect(env.action).to.equal('update')
    expect(env.operationId).to.equal('replaceCollection')
    expect(env.params).to.eql({ collectionId: '5' })
    expect(env.query).to.eql({ elevate: false })
    expect(env.status).to.equal(200)
    expect(env.body).to.eql({ name: 'NCCM' })
  })

  it('produces a unique eventId per call', function () {
    const a = buildEnvelope(makeReq(), makeRes())
    const b = buildEnvelope(makeReq(), makeRes())
    expect(a.eventId).to.not.equal(b.eventId)
  })

  it('is JSON-serializable', function () {
    const env = buildEnvelope(makeReq(), makeRes())
    expect(() => JSON.stringify(env)).to.not.throw()
  })

  it('tolerates an absent userObject and access_token', function () {
    const req = makeReq({ userObject: undefined, access_token: undefined })
    const env = buildEnvelope(req, makeRes())
    expect(env.actor.type).to.equal('user')
    expect(env.actor.userId).to.equal(undefined)
    expect(env.actor.clientId).to.equal(undefined)
  })

  it('merges eventInfo.params over the path params', function () {
    const res = makeRes({ eventInfo: { success: true, params: { destCollectionId: '9' } } })
    const env = buildEnvelope(makeReq(), res)
    expect(env.params).to.eql({ collectionId: '5', destCollectionId: '9' })
  })

  it('passes non-reserved eventInfo content through to info', function () {
    const res = makeRes({
      eventInfo: { success: true, params: { a: 1 }, grantsAdded: ['u1'], grantsRemoved: [] }
    })
    const env = buildEnvelope(makeReq(), res)
    expect(env.info).to.eql({ grantsAdded: ['u1'], grantsRemoved: [] })
    expect(env.info).to.not.have.property('success')
    expect(env.info).to.not.have.property('params')
  })

  it('omits info when the handler supplied nothing beyond reserved keys', function () {
    expect(buildEnvelope(makeReq(), makeRes()).info).to.equal(undefined)
    const res = makeRes({ eventInfo: { success: true, params: { a: 1 } } })
    expect(buildEnvelope(makeReq(), res).info).to.equal(undefined)
  })

  it('includes a body under the size cap', function () {
    const env = buildEnvelope(makeReq({ body: { name: 'small' } }), makeRes())
    expect(env.body).to.eql({ name: 'small' })
    expect(env.bodyBytes).to.equal(undefined)
  })

  it('omits an over-cap body and reports bodyBytes instead', function () {
    const big = { blob: 'x'.repeat(70000) }
    const env = buildEnvelope(makeReq({ body: big }), makeRes())
    expect(env.body).to.equal(undefined)
    expect(env.bodyBytes).to.be.a('number').greaterThan(65536)
  })

  it('omits an absent body without setting bodyBytes', function () {
    const env = buildEnvelope(makeReq({ body: undefined }), makeRes())
    expect(env.body).to.equal(undefined)
    expect(env.bodyBytes).to.equal(undefined)
  })

  it('never includes a body when the cap is 0', function () {
    // maxBody is read at call time through an injectable default
    const env = buildEnvelope(makeReq(), makeRes(), { maxBody: 0 })
    expect(env.body).to.equal(undefined)
    expect(env.bodyBytes).to.be.a('number').greaterThan(0)
  })
})

describe('eventBus consumer subscription', function () {
  let handlers = []

  // The bus is a singleton shared across tests in this file, so every
  // subscription must be torn down or later tests see stray events.
  afterEach(function () {
    for (const h of handlers) off(h)
    handlers = []
  })

  function subscribe (fn) {
    handlers.push(fn)
    on(fn)
    return fn
  }

  it('delivers an emitted envelope to a subscriber', function () {
    const received = []
    subscribe(env => received.push(env))
    finishHandler(makeReq(), makeRes())
    expect(received).to.have.lengthOf(1)
    expect(received[0].operationId).to.equal('replaceCollection')
    expect(received[0].resource).to.equal('collection')
  })

  it('delivers to every subscriber', function () {
    const a = [], b = []
    subscribe(env => a.push(env))
    subscribe(env => b.push(env))
    finishHandler(makeReq(), makeRes())
    expect(a).to.have.lengthOf(1)
    expect(b).to.have.lengthOf(1)
  })

  it('does not emit when shouldEmit is false', function () {
    const received = []
    subscribe(env => received.push(env))
    finishHandler(makeReq(), makeRes({ statusCode: 400 }))
    expect(received).to.have.lengthOf(0)
  })

  it('emits at most once per request even if the hook fires twice', function () {
    const received = []
    subscribe(env => received.push(env))
    const req = makeReq()
    const res = makeRes()
    finishHandler(req, res)
    finishHandler(req, res)
    expect(received).to.have.lengthOf(1)
  })

  it('off() stops delivery to that handler only', function () {
    const a = [], b = []
    const handlerA = env => a.push(env)
    const handlerB = env => b.push(env)
    subscribe(handlerA)
    subscribe(handlerB)
    off(handlerA)
    finishHandler(makeReq(), makeRes())
    expect(a).to.have.lengthOf(0)
    expect(b).to.have.lengthOf(1)
  })

  it('off() with an unknown handler is a no-op', function () {
    expect(() => off(() => {})).to.not.throw()
  })

  it('subscribing the same handler twice delivers once and off() removes it', function () {
    const received = []
    const handler = env => received.push(env)
    subscribe(handler)
    on(handler)
    finishHandler(makeReq(), makeRes())
    expect(received).to.have.lengthOf(1)
    off(handler)
    finishHandler(makeReq(), makeRes({ statusCode: 200 }))
    expect(received).to.have.lengthOf(1)
  })
})

describe('eventBus consumer isolation', function () {
  let handlers = []
  afterEach(function () {
    for (const h of handlers) off(h)
    handlers = []
  })
  function subscribe (fn) {
    handlers.push(fn)
    on(fn)
    return fn
  }

  it('a throwing sync consumer does not starve later consumers', function () {
    const later = []
    subscribe(() => { throw new Error('boom') })
    subscribe(env => later.push(env))
    expect(() => finishHandler(makeReq(), makeRes())).to.not.throw()
    expect(later).to.have.lengthOf(1)
  })

  it('a rejecting async consumer does not starve later consumers or reject out', async function () {
    const later = []
    subscribe(async () => { throw new Error('async boom') })
    subscribe(env => later.push(env))
    expect(() => finishHandler(makeReq(), makeRes())).to.not.throw()
    expect(later).to.have.lengthOf(1)
    // Give the rejected promise a turn to settle; an unhandled rejection here
    // would fail the process, which is exactly what the shim prevents.
    await new Promise(resolve => setImmediate(resolve))
  })

  it('a consumer error does not propagate out of finishHandler', function () {
    subscribe(() => { throw new Error('boom') })
    expect(() => finishHandler(makeReq(), makeRes())).to.not.throw()
  })
})

describe('eventBus.finishHandler error containment', function () {
  it('never throws even when the request object is malformed', function () {
    expect(() => finishHandler({}, {})).to.not.throw()
    expect(() => finishHandler(null, null)).to.not.throw()
  })
})
