const { randomUUID } = require('node:crypto')
const EventEmitter = require('node:events')
const config = require('./config')
const logger = require('./logger')

// res.eventInfo keys the capture logic consumes itself; everything else on
// eventInfo passes through verbatim to envelope.info (design §6).
const RESERVED_EVENT_INFO_KEYS = ['success', 'params']

/**
 * Decide whether a finished request should emit an event.
 * The x-event annotation and the kill switch are checked at hook-registration
 * time in bootstrap/extensionCheck.js, so this evaluates outcome only.
 */
function shouldEmit (req, res) {
  const eventInfo = res.eventInfo
  if (eventInfo && typeof eventInfo.success === 'boolean') {
    // A streaming handler commits a 200 header before its mutation finishes,
    // so the handler's own verdict overrides the status code.
    return eventInfo.success
  }
  return res.statusCode >= 200 && res.statusCode < 300
}

/**
 * Build the JSON-serializable event envelope (design §3).
 * options.maxBody exists so unit tests can exercise the cap without mutating
 * process.env; production callers omit it and get the configured value.
 */
function buildEnvelope (req, res, options = {}) {
  const maxBody = options.maxBody ?? config.events.maxBody
  const xEvent = req.openapi?.schema?.['x-event'] ?? {}
  const eventInfo = res.eventInfo

  const envelope = {
    eventId: randomUUID(),
    date: new Date().toISOString(),
    requestId: req.requestId,
    actor: {
      type: 'user',
      userId: req.userObject?.userId,
      username: req.userObject?.username,
      clientId: req.access_token?.azp
    },
    resource: xEvent.resource,
    action: xEvent.action,
    operationId: req.openapi?.schema?.operationId,
    params: { ...req.openapi?.pathParams, ...eventInfo?.params },
    query: req.query,
    status: res.statusCode
  }

  // Body: include under the cap, otherwise report only its size. Truncated
  // JSON is useless to an audit reader, so omit rather than truncate (§3).
  if (req.body !== undefined && req.body !== null) {
    const serialized = JSON.stringify(req.body)
    const bytes = serialized === undefined ? 0 : Buffer.byteLength(serialized)
    if (bytes > 0) {
      if (bytes <= maxBody) {
        envelope.body = req.body
      }
      else {
        envelope.bodyBytes = bytes
      }
    }
  }

  // Non-reserved eventInfo content passes through unschema'd.
  if (eventInfo) {
    const info = {}
    let hasInfo = false
    for (const key of Object.keys(eventInfo)) {
      if (!RESERVED_EVENT_INFO_KEYS.includes(key)) {
        info[key] = eventInfo[key]
        hasInfo = true
      }
    }
    if (hasInfo) envelope.info = info
  }

  return envelope
}

const EVENT_NAME = 'event'

const emitter = new EventEmitter()
// SSE will eventually mean one listener per connected client, as logSocket
// sessions do on loggerEvents today. Remove the warning threshold rather than
// pick an arbitrary ceiling.
emitter.setMaxListeners(0)

// Maps a caller's handler to the isolating shim actually registered, so that
// off() can remove the right listener.
const shims = new Map()

/**
 * Subscribe to every event on the bus. Consumers filter on
 * envelope.resource / action / ids themselves.
 *
 * The handler is wrapped rather than registered directly: EventEmitter calls
 * listeners synchronously inside emit(), so a throwing listener would
 * propagate into the onFinished callback and starve every later listener,
 * and an async listener's rejection would become an unhandled rejection that
 * terminates the process. The shim makes a consumer bug cost a log line.
 */
function on (handler) {
  if (shims.has(handler)) return
  const shim = async (envelope) => {
    try {
      await handler(envelope)
    }
    catch (e) {
      logger.writeError('eventBus', 'consumer-error', {
        message: e?.message,
        stack: e?.stack
      })
    }
  }
  shims.set(handler, shim)
  emitter.on(EVENT_NAME, shim)
}

function off (handler) {
  const shim = shims.get(handler)
  if (!shim) return
  emitter.off(EVENT_NAME, shim)
  shims.delete(handler)
}

/**
 * Called by the onFinished hook that bootstrap/extensionCheck.js registers for
 * x-event annotated operations. The response has already been sent by the time
 * this runs, so nothing here may throw.
 */
function finishHandler (req, res) {
  try {
    if (!req || !res) return
    if (res._eventEmitted) return
    if (!shouldEmit(req, res)) return
    res._eventEmitted = true
    emitter.emit(EVENT_NAME, buildEnvelope(req, res))
  }
  catch (e) {
    logger.writeError('eventBus', 'emit-error', {
      message: e?.message,
      stack: e?.stack,
      requestId: req?.requestId
    })
  }
}

module.exports = {
  finishHandler,
  on,
  off,
  // exported for unit tests
  shouldEmit,
  buildEnvelope
}
