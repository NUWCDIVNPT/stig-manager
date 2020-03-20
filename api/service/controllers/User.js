'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const User = require(`../service/${config.database.type}/UserService`)

module.exports.createUser = async function createUser (req, res, next) {
  let body = req.swagger.params['body'].value
  let projection = req.swagger.params['projection'].value
  try {
    let response = await User.createUser(body, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUsers = async function getUsers (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let elevate = req.swagger.params['elevate'].value
  let role = req.swagger.params['role'].value
  let packageId = req.swagger.params['packageId'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let dept = req.swagger.params['dept'].value
  let canAdmin = req.swagger.params['canAdmin'].value
  try {
    let response = await User.getUsers(projection, elevate, role, packageId, benchmarkId, dept, canAdmin, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}
