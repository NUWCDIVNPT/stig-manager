const config = require('../utils/config')
const OperationService = require(`../service/OperationService`)
const escape = require('../utils/escape')
const {JSONPath} = require('jsonpath-plus')
const SmError = require('../utils/error.js')
const state = require('../utils/state')

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
    if (!config.experimental.appData) throw new SmError.NotFoundError('endpoint disabled, to enable set STIGMAN_EXPERIMENTAL_APPDATA=true')
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    const format = req.query.format || 'gzip'
    res.attachment(`appdata-v${config.lastMigration}_${escape.filenameComponentFromDate()}.jsonl${format==='gzip'?'.gz':''}`)
    if (format === 'jsonl') res.type('application/jsonl')
    req.noCompression = true

    // the service method will stream the appdata file to the response object
    OperationService.getAppData(res, format)
    // the service ends the response by closing the gzip stream
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAppDataTables = async function (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    const response = await OperationService.getAppDataTables()
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceAppData = async function replaceAppData (req, res, next) {
  // write JSONL to the response; called from the service method
  function progressCb(json) {
    res.write(JSON.stringify(json) + '\n')
  }
  
  try {
    if (!config.experimental.appData) throw new SmError.NotFoundError('endpoint disabled, to enable set STIGMAN_EXPERIMENTAL_APPDATA=true')
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    let chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    res.setHeader('Content-Type', 'application/jsonl; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    req.noCompression = true
    await OperationService.replaceAppData(buffer, req.headers['content-type'], progressCb )
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

module.exports.getAppInfo = async function getAppInfo (req, res, next) {
  try {
    let elevate = req.query.elevate
    if ( elevate ) {
      const options = {
        includeRowCounts: req.query.includeRowCounts
      }
      const response = await OperationService.getAppInfo(options)
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

module.exports.getState = function (req, res, next) {
  try {
    res.json(state.apiState)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getDetails = module.exports.getAppInfo

module.exports.setMode = function (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    if (state.mode.currentMode === req.body.mode) {
      throw new SmError.UnprocessableError(`API mode is already ${state.mode.currentMode}`)
    }
    const { mode, message } = req.body
    const force = req.query.force === 'true' || req.query.force === true
    const {success, error} = state.setMode({ currentMode: mode, requestedBy: req.userObject.userId, message }, force)
    if (!success) {
      throw new SmError.UnprocessableError(error)
    }
    res.json(state.apiState)
  }
  catch (err) {
    next(err)
  }
}

module.exports.scheduleModeChange = function (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    if (state.mode.currentMode === req.body.nextMode) {
      throw new SmError.UnprocessableError(`API mode is already ${state.mode.currentMode}`)
    }
    state.scheduleMode({ ...req.body, requestedBy: req.userObject.userId })
    res.json(state.apiState)
  }
  catch (err) {
    next(err)
  }
}

module.exports.cancelScheduledModeChange = function (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    if (!state.mode.scheduled) {
      throw new SmError.NotFoundError(`A mode change is not scheduled`)
    }
    state.cancelScheduledMode()
    res.json(state.apiState)
  }
  catch (err) {
    next(err)
  }
}

module.exports.streamStateSse = function (req, res, next) {
  try {
    req.noCompression = true
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Helper to send SSE events
    function sendEvent(eventName, data) {
      if (eventName) res.write(`event: ${eventName}\n`);
      res.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
    }

    // Send initial state
    sendEvent('state-report', state.apiState);

    // Event listeners
    const stateChangedListener = () => sendEvent('state-changed', state.apiState);
    const modeChangedListener = () => sendEvent('mode-changed', state.apiState);
    const modeScheduledListener = () => sendEvent('mode-change-scheduled', state.apiState);
    const modeUnscheduledListener = () => sendEvent('mode-change-unscheduled', state.apiState);
    const dependencyChangedListener = () => sendEvent('dependency-changed', state.apiState);

    state.on('state-changed', stateChangedListener);
    state.on('mode-changed', modeChangedListener);
    state.on('mode-scheduled', modeScheduledListener);
    state.on('mode-unscheduled', modeUnscheduledListener);
    state.on('dependency-changed', dependencyChangedListener);

    // Keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      sendEvent('state-report', state.apiState);
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      state.off('state-changed', stateChangedListener);
      state.off('mode-changed', modeChangedListener);
      state.off('mode-scheduled', modeScheduledListener);
      state.off('mode-unscheduled', modeUnscheduledListener);
      state.off('dependency-changed', dependencyChangedListener);
      res.end();
    });
  } catch (err) {
    next(err);
  }
}

module.exports.getMaintenanceSocket = async function (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    res.status(204).end()
  }
  catch (err) {
    next(err)
  }
}
