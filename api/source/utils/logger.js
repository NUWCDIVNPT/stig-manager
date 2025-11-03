
const uuid = require('uuid')
const onFinished = require('on-finished')
const onHeaders = require('on-headers')
const config = require('./config')
const EventEmitter = require('node:events')

const loggerEvents = new EventEmitter()

// Ensure no other code will write to the console
const _log = console.log
for (const method of ['log', 'error', 'warn', 'trace', 'debug']) {
  console[method] = function () {
    writeError('logger', 'consoleIntercept', { method, arguments })
  }
}

// Setup noops for logger methods > config.log.level
const writeDebug = config.log.level == 4 ? function writeDebug () {
  write(4, ...arguments)
} : () => {}

const writeInfo = config.log.level >= 3 ? function writeInfo () {
  write(3, ...arguments)
} : () => {}

const writeWarn = config.log.level >= 2 ? function writeWarn () {
  write(2, ...arguments)
} : () => {}

const writeError = config.log.level >= 1 ? function writeError () {
  write(1, ...arguments)
} : () => {}

// Stats for all requests
const requestStats = {
  totalRequests: 0,
  totalApiRequests: 0,
  totalRequestDuration: 0,
  operationIds: {}
}

// All messages to STDOUT are handled here
async function write (level, component, type, data) {
  try {
    const date = new Date().toISOString()
    const logObj = {date, level, component, type, data}
    _log(JSON.stringify(logObj))
    loggerEvents.emit('log', logObj)
  }
  catch (e) {
    const date = new Date().toISOString()
    const errorObj = {date, level:1, component:'logger', type:'error', data: { message: e.message, stack: e.stack}}
    _log(JSON.stringify(errorObj))
    loggerEvents.emit('log', errorObj)
  }
}

// Base64 decoding
const atob = (data) => Buffer.from(data, 'base64').toString('ascii')

function sanitizeHeaders () {
  let {authorization, ...headers} = this
  if (authorization !== undefined) {
    headers.authorization = true
    if (config.log.mode !== 'combined') {
      const payload = authorization.match(/^Bearer [[A-Za-z0-9-_=]+\.([[A-Za-z0-9-_=]+?)\./)?.[1]
      if (payload) {
        headers.accessToken = JSON.parse(atob(payload))
      } 
    }
  }
  else {
    headers.authorization = false
  }
  return headers
}

function serializeRequest (req) {
  req.headers.toJSON = sanitizeHeaders
  if (config.log.mode === 'combined') {
    req.headers.accessToken = req.access_token
  }
  return {
    requestId: req.requestId,
    date: req._startTime,
    source: req.ip,
    // claims: req.userObject ? serializeUserObject(req.userObject) : undefined,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.query.elevate === true ||  req.query.elevate === 'true' || config.log.level === 4 ? req.body : undefined
  }
}

function recordStartTime () {
  this._startTime = new Date()
}

function requestLogger (req, res, next) {

  req._startAt = undefined
  req._startTime = undefined
  res._startAt = undefined
  res._startTime = undefined
  res.svcStatus = {}
  req.requestId = uuid.v1()
  
  // Response body length for appinfo and content for privileged requests
  let responseBody
  responseBody = ''
  if (req.query.elevate) {
    const originalSend = res.send
    res.send = function (chunk) {
      if (chunk !== undefined) {
        responseBody += chunk
      }
      originalSend.apply(res, arguments)
    }
  }

  // record request start
  recordStartTime.call(req)

  function logRequest () {
    if (req.originalUrl.startsWith('/api')) {
      req.component = 'rest'
    } else {
      req.component = 'static'
    }
    writeInfo(req.component, 'request', serializeRequest(req))
  }

  function logResponse () {
    res._startTime = res._startTime ?? new Date()
    requestStats.totalRequests += 1
    const durationMs = Number(res._startTime - req._startTime)

    requestStats.totalRequestDuration += durationMs
    const operationId = res.req.openapi?.schema.operationId
    let operationStats = {
      operationId,
      retries: res.svcStatus?.retries,
      durationMs
    }

    //if operationId is defined, this is an api endpoint response so we can track some stats
    if (operationId ) {
      trackOperationStats(operationId, durationMs, res)
      // If including stats in log entries, add to operationStats object
      if (config.log.optStats) {
        operationStats = {
          ...operationStats,
          ...requestStats.operationIds[operationId]
        }
      }
    }    

    if (config.log.mode === 'combined') {
      writeInfo(req.component || 'rest', 'transaction', {
        request: serializeRequest(res.req),
        response: {
          date: res._startTime,
          status: res.finished ? res.statusCode : undefined,
          clientTerminated: res.destroyed ? true : undefined,
          headers: res.finished ? res.getHeaders() : undefined,
          errorBody: res.errorBody,
          responseBody,
        },
        operationStats
      })  
    }
    else {
      writeInfo(req.component || 'rest', 'response', {
        requestId: res.req.requestId,
        status: res.statusCode,
        headers: res.getHeaders(),
        errorBody: res.errorBody,
        responseBody,
        operationStats
      })  
    }
  }

  if (config.log.mode !== 'combined') {
    logRequest()
  }
  onHeaders(res, recordStartTime)
  onFinished(res, logResponse)
  next()
}

function serializeEnvironment () {
  let env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(NODE|STIGMAN)_/.test(key)) {
      env[key] = key === 'STIGMAN_DB_PASSWORD' ? '*' : value
    }
  }
  return env
}

function trackOperationStats(operationId, durationMs, res) {

  const acceptsRequestBody = (res.req.method === 'POST' || res.req.method === 'PUT' || res.req.method === 'PATCH')

  //increment total api requests
  requestStats.totalApiRequests++
  // Ensure the operationIds object exists for the operationId
  if (!requestStats.operationIds[operationId]) {
    requestStats.operationIds[operationId] = {
      totalRequests: 0,
      totalDuration: 0,
      elevatedRequests: 0,
      minDuration: Infinity,
      maxDuration: 0,
      maxDurationUpdates: 0,
      retried: 0,
      averageRetries: 0,
      totalResLength: 0,
      minResLength: Infinity,
      maxResLength: 0,
      clients: {},
      users: {},
      errors: {}
    }
    if (acceptsRequestBody) {
      requestStats.operationIds[operationId].totalReqLength = 0
      requestStats.operationIds[operationId].minReqLength = Infinity
      requestStats.operationIds[operationId].maxReqLength = 0
    }
  }

  // Get the stats object for this operationId
  const stats = requestStats.operationIds[operationId]

  // errors
  if (res.statusCode >= 500) {
    const code = res.errorBody?.code || 'nocode'
    stats.errors[code] = (stats.errors[code] || 0) + 1
  }

  // Update max duration
  stats.minDuration = Math.min(stats.minDuration, durationMs)
  if (durationMs > stats.maxDuration) {
    stats.maxDuration = durationMs
    stats.maxDurationUpdates++
  }

  // Increment total requests and total duration for this operationId
  stats.totalRequests++
  stats.totalDuration += durationMs

  const responseLength = parseInt(res.getHeader('content-length')) || 0
  stats.totalResLength += responseLength
  stats.minResLength = Math.min(stats.minResLength, responseLength)
  stats.maxResLength = Math.max(stats.maxResLength, responseLength)

  if (acceptsRequestBody) {
    const requestLength = parseInt(res.req.headers['content-length']) || 0
    stats.totalReqLength += requestLength
    stats.minReqLength = Math.min(stats.minReqLength, requestLength)
    stats.maxReqLength = Math.max(stats.maxReqLength, requestLength)
  }

  // Update retries
  if (res.svcStatus?.retries) {
    stats.retried++
    stats.averageRetries = runningAverage({
      currentAvg: stats.averageRetries,
      counter: stats.retried,
      newValue: res.svcStatus.retries
    })    
  }
  // Check token for userid
  let userId = res.req.userObject?.userId || 'unknown'
  // Increment user count for this operationId
  stats.users[userId] = (stats.users[userId] || 0) + 1  

  // Check token for client id
  let client = res.req.access_token?.azp || 'unknown'
  // Increment client count for this operationId
  stats.clients[client] = (stats.clients[client] || 0) + 1

  // Increment elevated request count if elevate query param is true
  if (res.req.query?.elevate === true) {
    stats.elevatedRequests = (stats.elevatedRequests || 0) + 1
  }

  // If projections are defined, track stats for each projection
  if (res.req.query?.projection?.length > 0) {
    stats.projections = stats.projections || {}
    for (const projection of res.req.query.projection) {
      // Ensure the projection stats object exists
      stats.projections[projection] = stats.projections[projection] || {
        totalRequests: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalDuration: 0,
        retried: 0,
        averageRetries: 0,
        get averageDuration() {
          return this.totalRequests ? Math.round(this.totalDuration / this.totalRequests) : 0
        }        
      }

      const projStats = stats.projections[projection]
      // Increment projection count and update duration stats
      projStats.totalRequests++
      projStats.minDuration = Math.min(projStats.minDuration, durationMs)
      projStats.maxDuration = Math.max(projStats.maxDuration, durationMs)
      projStats.totalDuration += durationMs
      
      // Update retries
      if (res.svcStatus?.retries) {
        projStats.retried++
        projStats.averageRetries = projStats.averageRetries + (res.svcStatus.retries - projStats.averageRetries) / projStats.retried
      }
    }
  }

  function runningAverage({currentAvg, counter, newValue}) {
    return currentAvg + (newValue - currentAvg) / counter
  }
}

module.exports = { 
  requestLogger, 
  sanitizeHeaders, 
  serializeRequest,
  serializeEnvironment,
  writeError, 
  writeWarn, 
  writeInfo, 
  writeDebug,
  requestStats,
  loggerEvents,
}
