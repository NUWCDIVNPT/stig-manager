const http = require('node:http')
const logger = require('../utils/logger')
const logSocket = require('../utils/logSocket')
const state = require('../utils/state')
const OperationSvc = require(`../service/OperationService`)
const { serializeError } = require('../utils/serializeError')
const config = require('../utils/config')
const { initializeDependencies } = require('./dependencies')
const path = require('node:path')

async function startServer(app, startTime) {

  const server = http.createServer(app)
  server.on('upgrade', (request) => {
    logger.writeInfo('server', 'upgrade-request', { 
      url: request.url,
      headers: request.headers,
      remoteAddress: request.socket.remoteAddress
    })
  })

  const onListenError = (e) => {
    logger.writeError('server', 'shutdown', { message: `Server failed establishing or while listening on port ${config.http.port}`, error: serializeError(e) })
    state.setState('fail')
  }
  server.on('error', onListenError)

  await logSocket.setupLogSocket(server, path.join(__dirname, '../specification/log-socket.yaml'))

  server.listen(config.http.port, async function () {
    server.removeListener('error', onListenError)
    logger.writeInfo('server', 'listening', {
      port: config.http.port,
      api: '/api',
      client: config.client.disabled ? undefined : '/',
      documentation: config.docs.disabled ? undefined : '/docs',
      swagger: config.swaggerUi.enabled ? '/api-docs' : undefined
    })
    await initializeDependencies()
    // Set/change classification if indicated
    await applyConfigurationSettings()
    logStartupDuration(startTime)
  })
}

async function applyConfigurationSettings() {
  if (config.settings.setClassification) {
    await OperationSvc.setConfigurationItem('classification', config.settings.setClassification)
  }
}

function logStartupDuration(startTime) {
  const endTime = process.hrtime.bigint()
  logger.writeInfo('server', 'started', {
    durationS: Number(endTime - startTime) / 1e9
  })
}

module.exports = startServer
