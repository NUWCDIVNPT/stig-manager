'use strict';

const path = require('path')
const http = require('http')
const express = require('express')
const cors = require('cors');
const morgan = require('morgan')
const oasTools = require('oas-tools')
const config = require('./utils/config')
const auth = require('./utils/auth')
const swaggerUi = require('swagger-ui-express')
const jsyaml = require('js-yaml');
const fs = require('fs')
const multer  = require('multer')
const writer = require('./utils/writer.js')
const OperationSvc = require(`./service/${config.database.type}/OperationService`)
const compression = require('compression')
const smFetch = require('./utils/fetchStigs')

console.log(`Starting STIG Manager ${config.version}`)

// Express config
const app = express();
let storage =  multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(config.http.maxUpload)
  }
 })
app.use(upload.single('importFile'))
app.use(express.json({
  limit: parseInt(config.http.maxJsonBody)
})) //Handle JSON request body
app.use(cors())
morgan.token('token-user', (req, res) => {
  if (req.access_token) {
    return req.access_token[config.oauth.claims.username] || req.access_token[config.oauth.claims.servicename]
  }
})
morgan.token('forwarded-for', (req, res) => {
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for']
  }
})

// Log format
app.use(morgan(':remote-addr :forwarded-for :token-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]', {stream: process.stdout}))

// compress all responses
// app.use(compression())


// swaggerRouter configuration
let options = {
  loglevel: 'error',
  controllers: path.join(__dirname, './controllers'),
  checkControllers: false,
  useStubs: process.env.NODE_ENV === 'development', // Conditionally turn on stubs (mock mode)
  oasSecurity: true,
  securityFile: {
    oauth: auth.verifyRequest 
  }
}

// OpenAPI specification
//let spec = fs.readFileSync(path.join(__dirname,'api/openapi.yaml'), 'utf8')
let spec = fs.readFileSync(path.join(__dirname,'./specification/stig-manager.yaml'), 'utf8')
let oasDoc = jsyaml.safeLoad(spec)
oasDoc.info.version = config.version
// oas-tools uses x-name property of requestBody to set name of the body parameter
// oas-tools uses x-swagger-router-controller property to determine the controller
// Set x-swagger-router-controller based on the first tag of each path/method
for (const path in oasDoc.paths) {
  for (const method in oasDoc.paths[path]) {
    if (Array.isArray(oasDoc.paths[path][method].tags)) {
      oasDoc.paths[path][method]['x-swagger-router-controller'] = oasDoc.paths[path][method].tags[0]
    }  
    if (oasDoc.paths[path][method].requestBody) {
      oasDoc.paths[path][method].requestBody['x-name'] = 'body'
    }
  }
}

// Replace host with environmental values
oasDoc.servers[0].url = config.swaggerUi.server
oasDoc.components.securitySchemes.oauth.flows.implicit.authorizationUrl = `${config.swaggerUi.authority}/protocol/openid-connect/auth`

// Initialize the Swagger middleware
oasTools.configure(options)
oasTools.initialize(oasDoc, app, function () {
  run()
})

async function run() {
  try {
    if (!config.client.disabled) {
      await setupClient(app, config.client.directory)
    }
    else {
      console.log('[CLIENT] Client is disabled')
    }
    if (config.swaggerUi.enabled) {
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(oasDoc, null, {
        oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl
      }))
      app.get('/swagger.json', function(req, res) {
          res.setHeader('Content-Type', 'application/json');
          res.send(oasDoc);
      })
    }
    app.use((err, req, res, next) => {
      if (err) {
        console.log('Invalid Request data')
        writer.writeJson(res, writer.respondWithCode ( 400, {message: err.message} ))
      } else {
        next()
      }
    })
    startServer(app)
  }
  catch (err) {
    console.error(err.message);
    process.exit(1);
  }
 }


async function setupClient(app, directory) {
  try {
    console.log(`[CLIENT] Setting up STIG Manager client...`)
    const envsub = require('envsub')
    let options = {
      all: false,
      diff: false,
      protect: false,
      syntax: 'default',
      system: true
    }
    process.env.STIGMAN_CLIENT_API_BASE = process.env.STIGMAN_CLIENT_API_BASE || '/api'
    process.env.STIGMAN_CLIENT_KEYCLOAK_AUTH = process.env.STIGMAN_CLIENT_KEYCLOAK_AUTH || 'http://localhost:8080/auth'
    process.env.STIGMAN_CLIENT_KEYCLOAK_REALM = process.env.STIGMAN_CLIENT_KEYCLOAK_REALM || 'stigman'
    process.env.STIGMAN_CLIENT_KEYCLOAK_CLIENTID = process.env.STIGMAN_CLIENT_KEYCLOAK_CLIENTID || 'stig-manager'
    process.env.STIGMAN_VERSION = config.version
    
    let templateFile = path.join(__dirname, directory, '/js/Env.js.template')
    let outputFile = path.join(__dirname, directory, '/js/Env.js')
    let envobj
    envobj = await envsub({templateFile, outputFile, options})
  
    templateFile = path.join(__dirname, directory, '/js/keycloak.json.template')
    outputFile = path.join(__dirname, directory, '/js/keycloak.json')
    envobj = await envsub({templateFile, outputFile, options})

    app.use('/', express.static(path.join(__dirname, directory)))
  }
  catch (err) {
    console.error(err.message)
  }
}

async function startServer(app) {
  try {
    // Initialize database connection pool
    let db = require(`./service/${config.database.type}/utils`)
    const inits = await Promise.all([auth.initializeAuth(), db.initializeDatabase()])

    if (config.init.importStigs && inits[1]) {
      console.log(`[INIT] Importing STIGs...`)
      // await smFetch.readCompilation()
      await smFetch.fetchCompilation()
    }
    if (config.init.importScap && inits[1]) {
      console.log(`[INIT] Importing SCAP...`)
      await smFetch.fetchScap()
    }

    // Set/change classification if indicated
    console.log(`[START] Checking classification...`)
    if (config.settings.setClassification) {
      console.log(`[START] Setting classification to ${config.settings.setClassification}`)
      await OperationSvc.setConfigurationItem('classification', config.settings.setClassification)
    }

    // Start the server
    http.createServer(app).listen(config.http.port, function () {
      console.log('[START] Server is listening on port %d', config.http.port)
      console.log('[START] API is available at /api')
      if (config.swaggerUi.enabled) {
        console.log('[START] API documentation is available at /api-docs')
      }
      if (!config.client.disabled) {
        console.log('[START] Client is available at /')
      }
    })
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}

