const logger = require('../utils/logger')
const path = require('node:path')
const logSocket = require('../utils/logSocket')
const state = require('../utils/state')
const OperationSvc = require(`../service/OperationService`)
const { serializeError } = require('../utils/serializeError')
const config = require('../utils/config')
const { initializeDependencies } = require('./dependencies')
const path = require('node:path')

function setupTls() {
  if (config.http.tls?.key_file && config.http.tls?.cert_file) {
    const fs = require('node:fs')
    let key, cert
    try {
      key = fs.readFileSync(config.http.tls.key_file)
    } catch (e) {
      logger.writeError('server', 'tls_key_read_error', {message: `Failed reading TLS key file: ${config.http.tls.key_file}`, error: serializeError(e)})
      throw e
    }
    try {
      cert = fs.readFileSync(config.http.tls.cert_file)
    } catch (e) {
      logger.writeError('server', 'tls_cert_read_error', {message: `Failed reading TLS certificate file: ${config.http.tls.cert_file}`, error: serializeError(e)})
      throw e
    }
    const tlsOptions = {
      key: key,
      cert: cert
    }
    if (config.http.tls.key_passphrase) {
      tlsOptions.passphrase = config.http.tls.key_passphrase
    }
    return tlsOptions
  } else {
    return null
  }
}

async function startServer(app, startTime) {
  let server
  if (config.http.tls?.key_file && config.http.tls?.cert_file) {
    const https = require('node:https')
    const tlsOptions = setupTls()
    logger.writeInfo('server', 'tls_enabled', {message: 'Creating server with TLS/HTTPS'})
    server = https.createServer(tlsOptions, app)
  } else {
    const http = require('node:http')
    server = http.createServer(app)
  }
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
