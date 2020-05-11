'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const Operation = require(`../service/${config.database.type}/OperationService`)

module.exports.getVersion = async function getVersion (req, res, next) {
  try {
    let dbVersion = await Operation.getVersion()
    let response = {
      apiVersion: config.apiVersion,
      dataService: {
        type: config.database.type,
        version: dbVersion
      }
    }
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}
