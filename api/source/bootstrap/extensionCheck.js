const SmError = require('../utils/error')

function extensionCheck(req, res, next) {
  if (req.openapi?.schema['x-elevation-required'] && !req.query.elevate) {
    next(new SmError.ElevationError())
    return
  }
  this(req, res, next)
}

module.exports = extensionCheck