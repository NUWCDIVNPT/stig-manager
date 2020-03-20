'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const STIG = require(`../service/${config.database.type}/STIGService`)

module.exports.addSTIG = async function addSTIG (req, res, next) {
  let source = req.swagger.params['source'].value
  try {
    let response = await STIG.addSTIG(source, req.userObject)
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
  let benchmarkId = req.swagger.params['benchmarkId'].value
  try {
    let response = await STIG.deleteStigById(benchmarkId, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
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
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  let groupId = req.swagger.params['groupId'].value
  try {
    let response = await STIG.getGroupByRevision(benchmarkId, revisionStr, groupId, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getGroupsByRevision = async function getGroupsByRevision (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  let profile = req.swagger.params['profile'].value
  try {
    let response = await STIG.getGroupsByRevision(benchmarkId, revisionStr, profile, req.userObject)
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
  let ruleId = req.swagger.params['ruleId'].value
  try {
    let response = await STIG.getRuleByRuleId(ruleId, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getRulesByRevision = async function getRulesByRevision (req, res, next) {
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  let profile = req.swagger.params['profile'].value
  try {
    let response = await STIG.getRulesByRevision(benchmarkId, revisionStr, profile, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getSTIGs = async function getSTIGs (req, res, next) {
  let packageId = req.swagger.params['packageId'].value
  let assetId = req.swagger.params['assetId'].value
  let title = req.swagger.params['title'].value
  let os = req.swagger.params['os'].value
  try {
    let response = await STIG.getSTIGs(packageId, assetId, title, os, req.userObject)
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
