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
const upload = multer({ dest: 'uploads/' })
const writer = require('./utils/writer.js')


const app = express();
app.use(upload.single('importFile'))

app.use(express.json()) //Handle JSON request body
app.use(cors())
app.use(morgan('combined', {stream: process.stdout}))

// swaggerRouter configuration
let options = {
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
oasDoc.components.securitySchemes.oauth.flows.implicit.authorizationUrl = `${config.oauth.authority}/protocol/openid-connect/auth`

// Initialize the Swagger middleware
oasTools.configure(options)
oasTools.initialize(oasDoc, app, function () {
  // app.use('/stig-manager/ui', )
  // app.use('/stig-manager/ui', express.static(path.join(__dirname, '../../clients/extjs')))
  app.use('/stig-manager/ui', express.static(path.join(__dirname, './clients/extjs')))
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(oasDoc, null, {
      oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl
    }))
  app.get('/swagger.json', function(req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.send(oasDoc);
  })
  app.use((err, req, res, next) => {
    if (err) {
      console.log('Invalid Request data')
      writer.writeJson(res, writer.respondWithCode ( 400, {message: err.message} ))
    } else {
      next()
    }
  })
  
  startServer(app)
 })

async function startServer(app) {
  try {
    // Initialize database connection pool
    let db = require(`./service/${config.database.type}/utils`)
    await Promise.all([auth.initializeAuth(), db.initializeDatabase()])

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

