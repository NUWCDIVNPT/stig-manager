const SmError = require('../utils/error')
const state = require('../utils/state')

function modeCheck(req, res, next) {
  if (state.currentMode === 'maintenance') {
    if (!req.openapi?.schema['x-stigman-maintenance']) {
      next(new SmError.EndpointUnavailableError('The system is currently in maintenance mode.'))
      return
    }
  }
  this(req, res, next)
}

module.exports = modeCheck