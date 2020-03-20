'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const Version = require(`../service/${config.database.type}/VersionService`)

module.exports.getVersion = async function getVersion (req, res, next) {
  try {
    let response = await Version.getVersion(req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}
