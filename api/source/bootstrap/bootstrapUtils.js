const path = require('node:path')
const logger = require('../utils/logger')

function modulePathResolver( handlersPath, route, apiDoc ) {
    const pathKey = route.openApiRoute.substring(route.basePath.length)
    const schema = apiDoc.paths[pathKey][route.method.toLowerCase()]
    const controller = schema.tags[0]
    const operationId = schema['operationId']
    const handler = require(path.join(handlersPath, controller))
    return handler[operationId]
}

function buildResponseValidationConfig(willValidateResponse) {
    if (willValidateResponse){
        return {
            onError: (error, body, req) => {
                logger.writeError('rest', 'responseValidation', {
                    error,
                    request: logger.serializeRequest(req),
                    body
                })
            }
        }
    }
    else {
        return false
    }
}

function logAppConfig(config) {
    logger.writeInfo('bootstrapUtils', 'starting bootstrap', {
      version: config.version,
      env: logger.serializeEnvironment(),
      dirname: __dirname,
      cwd: process.cwd()
    })
    logger.writeInfo('bootstrapUtils', 'configuration', config)
  
}
  
module.exports = {
    modulePathResolver,
    buildResponseValidationConfig,
    logAppConfig
}