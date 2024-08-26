const config = require('../utils/config')
const OperationService = require(`../service/OperationService`)
const escape = require('../utils/escape')
const {JSONPath} = require('jsonpath-plus')
const SmError = require('../utils/error.js')

module.exports.getConfiguration = async function getConfiguration (req, res, next) {
  try {
    const dbConfigs = await OperationService.getConfiguration()
    const {version, commit, lastMigration} = config
    res.json({ version, commit, lastMigration, ...dbConfigs })
  }
  catch(err) {
    next(err)
  }
}

module.exports.setConfigurationItem = async function setConfigurationItem (req, res, next) {
  try {
    //TODO: Implement
  }
  catch(err) {
    next(err)
  }
}

module.exports.getAppData = async function getAppData (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    res.attachment(`appdata-v${config.lastMigration}_${escape.filenameComponentFromDate()}.gz`)
    await OperationService.getAppData(res)
    // the service ends the response by closing the gzip stream
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceAppData = async function replaceAppData (req, res, next) {
  function progressCb(json) {
    res.write(JSON.stringify(json) + '\n')
  }
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')

    req.noCompression = true
    await OperationService.replaceAppData(req.file.buffer, progressCb )
    res.end()
  }
  catch (err) {
    next(err)
  }
}

module.exports.getDefinition = async function getDefinition (req, res, next) {
  try {
    let jsonpath = req.query.jsonpath
    if (jsonpath) {
      res.json(JSONPath(jsonpath, config.definition))
    }
    else {
      res.json(config.definition)
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getDetails = async function getDetails (req, res, next) {
  try {
    let elevate = req.query.elevate
    if ( elevate ) {
      const response = await OperationService.getDetails()
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}
