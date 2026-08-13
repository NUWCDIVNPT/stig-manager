const { randomUUID } = require('node:crypto')
const config = require('./config')

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

module.exports = {
  shouldEmit,
  buildEnvelope
}
