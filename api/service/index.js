'use strict';

const path = require('path')
const http = require('http')
const express = require('express')
const cors = require('cors');
const morgan = require('morgan')
const swaggerTools = require('oas-tools')
const config = require('./utils/config')
const auth = require('./utils/auth')
const swaggerUi = require('swagger-ui-express')
const jsyaml = require('js-yaml');
const fs = require('fs')

const app = express();
app.use(express.json()) //Handle JSON request body
app.use(cors())
app.use(morgan('combined', {stream: process.stdout}))

// swaggerRouter configuration
let options = {
  controllers: path.join(__dirname, './controllers'),
  useStubs: process.env.NODE_ENV === 'development', // Conditionally turn on stubs (mock mode)
  oasSecurity: true,
  securityFile: {
    oauth: auth.verifyRequest 
  }
}

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
let spec = fs.readFileSync(path.join(__dirname,'api/openapi.yaml'), 'utf8')
let swaggerDoc = jsyaml.safeLoad(spec)

// Replace host with environmental values
swaggerDoc.servers[0].url = config.swaggerUi.server
swaggerDoc.components.securitySchemes.oauth.flows.implicit.authorizationUrl = `${config.oauth.authority}/protocol/openid-connect/auth`

// Initialize the Swagger middleware
swaggerTools.configure(options)
swaggerTools.initialize(swaggerDoc, app, function () {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, null, {
      oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl
    }))
  app.get('/swagger.json', function(req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerDoc);
  })
  startServer(app)
 })

async function startServer(app) {
  try {
    // Initialize database connection pool
    let db = require(`./service/${config.database.type}/utils`)
    await db.initializeDatabase()

    // Start the server
    http.createServer(app).listen(config.http.port, function () {
      console.log('Your server is listening on port %d (http://localhost:%d)', config.http.port, config.http.port)
      console.log('Swagger-ui is available on http://localhost:%d/docs', config.http.port)
    })
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}

