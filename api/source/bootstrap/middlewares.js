
const path = require('node:path')
const multer  = require('multer')
const express = require('express')
const cors = require('cors')
const compression = require('compression')
const { middleware: openApiMiddleware } = require('express-openapi-validator')
const config = require('../utils/config')
const { modulePathResolver, buildResponseValidationConfig } = require('./bootstrapUtils')
const auth = require('../utils/auth')
const configureErrorHandlers = require('./errorHandlers')
const { requestLogger } = require('../utils/logger')
const state = require('../utils/state')
const logger = require('../utils/logger')

function configureMiddleware(app) {

    const middlewareConfigFunctions = [
      configureMulter,
      configureExpress,
      configureCors,
      configureLogging,
      configureCompression,
      configureServiceCheck,
      configureAuth,
      configureOpenApi,
      configureErrorHandlers,
  ]

  logger.writeInfo('middleware', 'bootstrap', { message: 'configuring middleware' })

  for (const middlewareConfigFunction of middlewareConfigFunctions) {
      middlewareConfigFunction(app)
  }

  logger.writeInfo('middleware', 'bootstrap', { message: 'middleware configured' })
}

function configureMulter(app) {
    let storage =  multer.memoryStorage()
    const upload = multer({ 
      storage,
      limits: {
        fileSize: parseInt(config.http.maxUpload)
      }
    })
    app.use(upload.single('importFile'))
}

function configureCors(app) {
  app.use(cors())
}

function configureLogging(app) {
  app.use(requestLogger)
}

function configureCompression(app) {  
  // compress responses
  app.use(compression({
    filter: (req, res) => {
      if (req.noCompression) {
        return false
      }
      return compression.filter(req, res)
    }
  }))
}

function configureServiceCheck(app) {
  app.use((req, res, next) => {
    try {
      if (
        state.currentState !== 'available' && req.url.startsWith('/api') && !req.url.startsWith('/api/op/state')) {
        res.status(503).json(state.apiState)
      }
      else {
        next()
      }
    }
    catch (e) {
      next(e)
    }
  })
}

function configureAuth(app) {
  app.use('/api', auth.validateToken)
  app.use('/api', auth.setupUser)
}

function configureExpress(app) {
    app.use(express.urlencoded( {extended: true}))
    app.use(express.json({
        strict: false, // allow root to be any JSON value, per https://datatracker.ietf.org/doc/html/rfc7159#section-2
        limit: parseInt(config.http.maxJsonBody)
    })) //Handle JSON request body
}

function configureOpenApi(app) {
 
  const apiSpecPath = path.join(__dirname, '../specification/stig-manager.yaml')
  app.use( "/api", openApiMiddleware ({
      apiSpec: apiSpecPath,
      validateRequests: {
          coerceTypes: false,
          allowUnknownQueryParameters: false,
      },
      validateResponses: buildResponseValidationConfig(config.settings.responseValidation === "logOnly"),
      validateApiSpec: true,
      $refParser: {
          mode: 'dereference',
      },
      operationHandlers: {
          basePath: path.join(__dirname, '../controllers'),
          resolver: modulePathResolver,
      },
      validateSecurity: {
          handlers:{
          oauth: auth.validateOauthSecurity 
          }
      },
      fileUploader: false
  }))
}

module.exports = configureMiddleware


