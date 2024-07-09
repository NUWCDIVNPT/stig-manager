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
let overallOpStats = {
  totalRequests: 0,
  totalApiRequests: 0,
  totalRequestDuration: 0,
  operationIdStats: {
    operationIdCounts: {},
    operationIdProjections: {},
    operationIdDurationTotals: {},
    operationIdDurationMin: {},
    operationIdDurationMax: {},
    clients: {}
  }
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
    let durationMs = Number(res._startTime - req._startTime)

    overallOpStats.totalRequestDuration  += durationMs
    let operationalStats = {
      retries: res.svcStatus?.retries,
      durationMs
    }

    let operationId = res.req.openapi?.schema.operationId
    //if operationId is defined, this is an api endpoint response so we can track some stats
    if (operationId ) {
      operationalStats = trackOperationStats(operationalStats, operationId, durationMs, res)
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
          operationalStats
        },

      })  
    }
    else {
      writeInfo(req.component || 'rest', 'response', {
        requestId: res.req.requestId,
        status: res.statusCode,
        headers: res.getHeaders(),
        errorBody: res.errorBody,
        retries: res.svcStatus?.retries,
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

function trackOperationStats (operationalStats, operationId, durationMs, res) {
  //increment total api requests
  overallOpStats.totalApiRequests++
  //increment operationId call count
  overallOpStats.operationIdStats.operationIdCounts[operationId] = (overallOpStats.operationIdStats.operationIdCounts[operationId] || 0) + 1
  //running total of duration for this operationId
  overallOpStats.operationIdStats.operationIdDurationTotals[operationId] = 
    (overallOpStats.operationIdStats.operationIdDurationTotals[operationId] || 0) + durationMs 
  //min duration for this operationId
  overallOpStats.operationIdStats.operationIdDurationMin[operationId] = 
    Math.min(overallOpStats.operationIdStats.operationIdDurationMin[operationId] || 99999999999, durationMs)
  //max duration for this operationId
  overallOpStats.operationIdStats.operationIdDurationMax[operationId] = 
    Math.max(overallOpStats.operationIdStats.operationIdDurationMax[operationId] || 0, durationMs)
  //check token for client id
  let client = res.req?.access_token?.azp || 'unknown'
  //track clients for this operationId
  overallOpStats.operationIdStats.clients[operationId] =
    overallOpStats.operationIdStats.clients[operationId] || {}
  // track operation counts for each client
  overallOpStats.operationIdStats.clients[operationId][client] =
    overallOpStats.operationIdStats.clients[operationId][client] || 0

  //increment client count for this operationId
  overallOpStats.operationIdStats.clients[operationId][client] = 
    (overallOpStats.operationIdStats.clients[operationId][client] || 0) + 1         

  //if projections are defined, track stats for each projection
  if (res.req.query?.projection?.length > 0){
      //for each projection, increment count, track min, max, total duration
      for (let projection of res.req.query.projection) {
        //track projections for this operationId
        overallOpStats.operationIdStats.operationIdProjections[operationId] =
          overallOpStats.operationIdStats.operationIdProjections[operationId] || {}
        //track projection stats for this operationId
        overallOpStats.operationIdStats.operationIdProjections[operationId][projection] =
          overallOpStats.operationIdStats.operationIdProjections[operationId][projection] || {}
        //increment projection count for this operationId
        overallOpStats.operationIdStats.operationIdProjections[operationId][projection].count = 
          (overallOpStats.operationIdStats.operationIdProjections[operationId][projection].count || 0) + 1;

        //track min, max, total duration for this projection
        overallOpStats.operationIdStats.operationIdProjections[operationId][projection].min = 
        Math.min(overallOpStats.operationIdStats.operationIdProjections[operationId][projection].min || 99999999999, durationMs)                

        overallOpStats.operationIdStats.operationIdProjections[operationId][projection].max = 
        Math.max(overallOpStats.operationIdStats.operationIdProjections[operationId][projection].max || 0, durationMs)             

        overallOpStats.operationIdStats.operationIdProjections[operationId][projection].durationTotal = 
          (overallOpStats.operationIdStats.operationIdProjections[operationId][projection].durationTotal || 0) + durationMs;

        //calculate average duration for this projection
        overallOpStats.operationIdStats.operationIdProjections[operationId][projection].durationAvg = 
          Math.round(overallOpStats.operationIdStats.operationIdProjections[operationId][projection].durationTotal / overallOpStats.operationIdStats.operationIdProjections[operationId][projection].count)

      }
  }
  // if including stats in log entries, add to operationalStats object
  if (config.log.optStats === 'true') {

    operationalStats.operationIdCount =  
    overallOpStats.operationIdStats.operationIdCounts[operationId]

    operationalStats.operationIdDurationMax = 
    overallOpStats.operationIdStats.operationIdDurationMax[operationId]

    operationalStats.operationIdDurationMin = 
    overallOpStats.operationIdStats.operationIdDurationMin[operationId]

    operationalStats.operationIdDurationAvg = 
    Math.round(overallOpStats.operationIdStats.operationIdDurationTotals[operationId] / overallOpStats.operationIdStats.operationIdCounts[operationId])
    
    operationalStats.clients = overallOpStats.operationIdStats.clients[operationId]

    if (res.req.query?.projection?.length > 0){
      operationalStats.operationIdProjections = overallOpStats.operationIdStats.operationIdProjections[operationId]
    }
  }
  return operationalStats
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
  overallOpStats,

}
