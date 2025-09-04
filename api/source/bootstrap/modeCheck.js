const SmError = require('../utils/error')
const state = require('../utils/state')
const maintenancePath = '/op/maintenance'

function modeCheck(req, res, next) {
  if (state.currentMode === 'normal') {
    if (req.path.startsWith(maintenancePath)) {
      next(new SmError.EndpointUnavailableError('The system is not in maintenance mode.'))
      return
    }
  }
  else if (!req.openapi?.schema['x-stigman-maintenance'] && !req.path.startsWith(maintenancePath)) {
    next(new SmError.EndpointUnavailableError('The system is in maintenance mode.'))
    return
  }
  this(req, res, next)
}

module.exports = modeCheck