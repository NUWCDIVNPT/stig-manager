const onFinished = require('on-finished')
const SmError = require('../utils/error')
const config = require('../utils/config')
const eventBus = require('../utils/eventBus')

function extensionCheck(req, res, next) {
  if (req.openapi?.schema['x-elevation-required'] && !req.query.elevate) {
    next(new SmError.ElevationError())
    return
  }
  // Register an event hook only for operations the spec annotates with
  // x-event. No operation is annotated today, so this registers nothing; the
  // cost for every request is one property read.
  if (config.events.enabled && req.openapi?.schema['x-event']) {
    onFinished(res, () => eventBus.finishHandler(req, res))
  }
  this(req, res, next)
}

module.exports = extensionCheck
