'use strict';

const packageJson = require("./package.json")
console.log(`Starting STIG Manager ${packageJson.version}`)

const config = require('./utils/config')
const path = require('path')
const http = require('http')
const express = require('express')
const cors = require('cors');
const morgan = require('morgan')
const auth = require('./utils/auth')
const swaggerUi = require('swagger-ui-express')
const jsyaml = require('js-yaml');
const fs = require('fs')
const multer  = require('multer')
const writer = require('./utils/writer.js')
const OperationSvc = require(`./service/${config.database.type}/OperationService`)
const compression = require('compression')
const smFetch = require('./utils/fetchStigs')
const {
  middleware: openApiMiddleware,
  resolvers,
} = require('express-openapi-validator');


//Catch unhandled errors. 
process.on('uncaughtException', (err, origin) => {
  console.log(`Uncaught ${err} from ${origin}`)
})

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
  strict: false, // allow root to be any JSON value, per https://datatracker.ietf.org/doc/html/rfc7159#section-2
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

//  2. Install the OpenApiValidator middleware
const apiSpecPath = path.join(__dirname, './specification/stig-manager.yaml');
let responseValidationConfig = buildResponseValidationConfig();
app.use(
  openApiMiddleware({
    apiSpec: apiSpecPath,
    validateRequests: {
      coerceTypes: true,
      allowUnknownQueryParameters: false,
    },
    validateResponses: responseValidationConfig,
    validateApiSpec: true,
    $refParser: {
      mode: 'dereference',
    },
    operationHandlers: {
      // 3. Provide the path to the controllers directory
      basePath: path.join(__dirname, 'controllers'),
      // 4. Provide a function responsible for resolving an Express RequestHandler
      //    function from the current OpenAPI Route object.
      resolver: modulePathResolver,
    },
    validateSecurity: {
      handlers:{
        oauth: auth.verifyRequest 
      }
    },
    fileUploader: false
  }),
);


app.use((err, req, res, next) => {
  // 7. Customize errors
  console.error(err); // dump error to console for debug
  res.status(err.status || 500).json(err);
});



run()



async function run() {
  try {
    if (!config.client.disabled) {
      await setupClient(app, config.client.directory)
    }
    else {
      console.log('[CLIENT] Client is disabled')
    }
    if (config.swaggerUi.enabled) {
      // Read and modify OpenAPI specification
      let spec = fs.readFileSync(path.join(__dirname,'./specification/stig-manager.yaml'), 'utf8')
      let oasDoc = jsyaml.safeLoad(spec)
      // Replace with config values
      oasDoc.info.version = config.version
      oasDoc.servers[0].url = config.swaggerUi.server
      oasDoc.components.securitySchemes.oauth.openIdConnectUrl = `${config.client.authority}/.well-known/openid-configuration`
      
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(oasDoc, null, {
        oauth2RedirectUrl: config.swaggerUi.oauth2RedirectUrl,
        oauth: {
          usePkceWithAuthorizationCodeGrant: true
        }
      }))
      app.get(['/swagger.json','/openapi.json'], function(req, res) {
        res.json(oasDoc);
      })
    }
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
    const envJS = 
`
const STIGMAN = {
  Env: {
    version: "${config.version}",
    apiBase: "${config.client.apiBase}",
    commit: {
        branch: "${config.commit.branch}",
        sha: "${config.commit.sha}",
        tag: "${config.commit.tag}",
        describe: "${config.commit.describe}"
    },
    oauth: {
        authority:  "${config.client.authority}",
        clientId: "${config.client.clientId}",
        refreshToken: {
          disabled: ${config.client.refreshToken.disabled}
        },
        extraScopes: "${config.client.extraScopes ?? ''}",
        claims: {
          scope: "${config.oauth.claims.scope}",
          scopeFormat: "${config.oauth.claims.scopeFormat}",
          username: "${config.oauth.claims.username}",
          servicename: "${config.oauth.claims.servicename}",
          name: "${config.oauth.claims.name}",
          privileges: "${config.oauth.claims.privileges}",
          email: "${config.oauth.claims.email}"
        }
    }
  }
}    
`
    app.get('/js/Env.js', function (req, res) {
      writer.writeWithContentType(res, {payload: envJS, contentType: "application/javascript"})
    })
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


function modulePathResolver(
  handlersPath,
  route,
  apiDoc
)
{
  const pathKey = route.openApiRoute.substring(route.basePath.length);
  const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];
  // const [controller, method] = schema['operationId'].split('.');
  const controller = schema.tags[0]
  const method = schema['operationId']
  const modulePath = path.join(handlersPath, controller);
  const handler = require(modulePath);
  if (handler[method] === undefined) {
    throw new Error(
      `Could not find a [${method}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`,
    );
  }
  return handler[method];
}

function buildResponseValidationConfig(){
  if ( config.settings.responseValidation == "logOnly" ){
    return {
        onError: (error, body, req) => {
          console.log(`Response body fails validation: `, error);
          console.log(`Response body emitted from:`, req.originalUrl);
          console.debug(`Response body:`, body);
        }
      }
  }
  else {
    return false
  }

}