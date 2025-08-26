module.exports.getMaintenancePathAvailable = async function (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    res.status(204).end()
  }
  catch (err) {
    next(err)
  }
}
