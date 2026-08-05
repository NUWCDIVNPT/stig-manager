const path = require('node:path')
const logger = require('../utils/logger')
const extensionCheck = require('./extensionCheck')

function modulePathResolver( handlersPath, route, apiDoc ) {
    const pathKey = route.openApiRoute.substring(route.basePath.length)
    const schema = apiDoc.paths[pathKey][route.method.toLowerCase()]
    const controller = schema.tags[0]
    const operationId = schema['operationId']
    const modulePath = path.join(handlersPath, controller)
    const handler = require(modulePath)
    if (handler[operationId] === undefined) {
      throw new Error(
        `Could not find a [${operationId}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`,
      )
    }
    return extensionCheck.bind(handler[operationId])
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

function logAppConfigWarnings() {
    if (process.env.STIGMAN_CLIENT_RESPONSE_MODE) {
        logger.writeWarn('bootstrapUtils', 'deprecation', {
            message: 'STIGMAN_CLIENT_RESPONSE_MODE is deprecated and will be removed in a future release, after which the client will always use the query response mode.'
        })
    }
}

module.exports = {
    modulePathResolver,
    buildResponseValidationConfig,
    logAppConfig,
    logAppConfigWarnings
}