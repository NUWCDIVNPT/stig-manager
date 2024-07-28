const uuid = require('uuid')
const onFinished = require('on-finished')
const onHeaders = require('on-headers')
const config = require('./config')


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
const overallOpStats = {
  totalRequests: 0,
  totalApiRequests: 0,
  totalRequestDuration: 0,
  operationIdStats: {}
}

// All messages to STDOUT are handled here
async function write (level, component, type, data) {
  try {
    const date = new Date().toISOString()
    _log(JSON.stringify({date, level, component, type, data}))  
  }
  catch (e) {
    const date = new Date().toISOString()
    _log(JSON.stringify({date, level:1, component:'logger', type:'error', data: { message: e.message, stack: e.stack}}))  
  }
}

// Base64 decoding
const atob = (data) => Buffer.from(data, 'base64').toString('ascii')

const serializeUserObject = ({username, display, privileges}) => ({username, fullname:display, privileges})

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

  // Response body handling for privileged requests
  let responseBody = undefined
  if (req.query.elevate === true || req.query.elevate === 'true' ) {
    responseBody = ''
    const originalSend = res.send
    res.send = function (chunk) {
      responseBody += chunk
      originalSend.apply(res, arguments)
      res.end()
    }
  }

  // record request start
  recordStartTime.call(req)

  function logRequest () {
    req.requestId = uuid.v1()
    writeInfo('rest', 'request', serializeRequest(req))
  }

  function logResponse () {
    res._startTime = res._startTime ?? new Date()
    overallOpStats.totalRequests += 1
    const durationMs = Number(res._startTime - req._startTime)

    overallOpStats.totalRequestDuration += durationMs
    const operationId = res.req.openapi?.schema.operationId
    let operationalStats = {
      operationId,
      retries: res.svcStatus?.retries,
      durationMs
    }

    //if operationId is defined, this is an api endpoint response so we can track some stats
    if (operationId ) {
      trackOperationStats(operationId, durationMs, res)
      // If including stats in log entries, add to operationalStats object
      if (config.log.optStats === 'true') {
        operationalStats = {
          ...operationalStats,
          ...overallOpStats.operationIdStats[operationId]
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
        operationalStats
      })  
    }
    else {
      writeInfo(req.component || 'rest', 'response', {
        requestId: res.req.requestId,
        status: res.statusCode,
        headers: res.getHeaders(),
        errorBody: res.errorBody,
        operationalStats
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
  //increment total api requests
  overallOpStats.totalApiRequests++
  // Ensure the operationIdStats object exists for the operationId
  if (!overallOpStats.operationIdStats[operationId]) {
    overallOpStats.operationIdStats[operationId] = {
      totalRequests: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      maxDurationUpdates: 0,
      get averageDuration() {
        return this.totalRequests ? Math.round(this.totalDuration / this.totalRequests) : 0;
      },
      clients: {},
    };
  }


  // Get the stats object for this operationId
  const stats = overallOpStats.operationIdStats[operationId];
  // Increment total requests and total duration for this operationId
  stats.totalRequests++;
  stats.totalDuration += durationMs;

  // Update min and max duration
  stats.minDuration = Math.min(stats.minDuration, durationMs);
  if (durationMs > stats.maxDuration) {
    stats.maxDuration = durationMs;
    stats.maxDurationUpdates++;
  }

  // Check token for client id
  let client = res.req?.access_token?.azp || 'unknown';
  // Increment client count for this operationId
  stats.clients[client] = (stats.clients[client] || 0) + 1;

  // If projections are defined, track stats for each projection
  if (res.req.query?.projection?.length > 0) {
    stats.projections = stats.projections || {};
    for (const projection of res.req.query.projection) {
      // Ensure the projection stats object exists
      stats.projections[projection] = stats.projections[projection] || {
        totalRequests: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalDuration: 0,
        get averageDuration() {
          return this.totalRequests ? Math.round(this.totalDuration / this.totalRequests) : 0;
        }        
      };

      const projStats = stats.projections[projection];
      // Increment projection count and update duration stats
      projStats.totalRequests++;
      projStats.minDuration = Math.min(projStats.minDuration, durationMs);
      projStats.maxDuration = Math.max(projStats.maxDuration, durationMs);
      projStats.totalDuration += durationMs;
    }
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
  overallOpStats

}
