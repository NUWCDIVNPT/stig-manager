'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const parsers = require('../utils/parsers.js')
const STIG = require(`../service/${config.database.type}/STIGService`)

module.exports.importManualBenchmark = async function importManualBenchmark (req, res, next) {
  try {
    let extension = req.file.originalname.substring(req.file.originalname.lastIndexOf(".")+1)
    if (extension.toLowerCase() != 'xml') {
      throw (writer.respondWithCode ( 400, {message: `File extension .${extension} not supported`} ))
    }
    let xmlData = req.file.buffer
    let benchmark
    try {
      benchmark = await parsers.benchmarkFromXccdf(xmlData)
    }
    catch(err){
      throw (writer.respondWithCode( 400, {message: err.message} ))
    }
    let response
    if (benchmark.scap) {
      response = await STIG.insertScapBenchmark(benchmark, xmlData)
    }
    else {
      response = await STIG.insertManualBenchmark(benchmark, xmlData)
    }
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}


module.exports.deleteRevisionByString = async function deleteRevisionByString (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  try {
    let response = await STIG.deleteRevisionByString(benchmarkId, revisionStr, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteStigById = async function deleteStigById (req, res, next) {
  if ( req.userObject.privileges.canAdmin ) {
    try {
      let benchmarkId = req.swagger.params['benchmarkId'].value
      let response = await STIG.deleteStigById(benchmarkId, req.userObject)
      writer.writeJson(res, response)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  }
  else {
    writer.writeJson(res, writer.respondWithCode ( 401, {message: "User has insufficient privilege to complete this request."} ) )
  } 
}

module.exports.getCci = async function getCci (req, res, next) {
  let cci = req.swagger.params['cci'].value
  try {
    let response = await STIG.getCci(cci, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getCcisByRevision = async function getCcisByRevision (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  try {
    let response = await STIG.getCcisByRevision(benchmarkId, revisionStr, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getGroupByRevision = async function getGroupByRevision (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  let groupId = req.swagger.params['groupId'].value
  try {
    let response = await STIG.getGroupByRevision(benchmarkId, revisionStr, groupId, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getGroupsByRevision = async function getGroupsByRevision (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  try {
    let response = await STIG.getGroupsByRevision(benchmarkId, revisionStr, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getRevisionByString = async function getRevisionByString (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  try {
    let response = await STIG.getRevisionByString(benchmarkId, revisionStr, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getRevisionsByBenchmarkId = async function getRevisionsByBenchmarkId (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  try {
    let response = await STIG.getRevisionsByBenchmarkId(benchmarkId, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getRuleByRuleId = async function getRuleByRuleId (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let ruleId = req.swagger.params['ruleId'].value
  try {
    let response = await STIG.getRuleByRuleId(ruleId, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getRuleByRevision = async function getRulesByRevision (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  let ruleId = req.swagger.params['ruleId'].value
  try {
    let response = await STIG.getRuleByRevision(benchmarkId, revisionStr, ruleId, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getRulesByRevision = async function getRulesByRevision (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  try {
    let response = await STIG.getRulesByRevision(benchmarkId, revisionStr, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getSTIGs = async function getSTIGs (req, res, next) {
  let title = req.swagger.params['title'].value
  try {
    let response = await STIG.getSTIGs(title, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getStigById = async function getStigById (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  try {
    let response = await STIG.getStigById(benchmarkId, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}
