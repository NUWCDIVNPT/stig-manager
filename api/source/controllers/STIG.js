'use strict';

const config = require('../utils/config');
const SmError = require('../utils/error');
const parsers = require('../utils/parsers.js')
const STIG = require(`../service/${config.database.type}/STIGService`)

module.exports.importBenchmark = async function importManualBenchmark (req, res, next) {
  try {
    const extension = req.file.originalname.substring(req.file.originalname.lastIndexOf(".")+1)
    if (extension.toLowerCase() != 'xml') {
      throw new SmError.ClientError(`File extension .${extension} not supported`)
    }
    let benchmark
    try {
      benchmark = await parsers.benchmarkFromXccdf(req.file.buffer)
    }
    catch(err){
      throw new SmError.ClientError(err.message)
    }
    if (benchmark.scap) {
      throw new SmError.UnprocessableError('SCAP Benchmarks are not imported.')
    }
    const revision = await STIG.insertManualBenchmark(benchmark, res.svcStatus)
    const response = await STIG.getRevisionByString(revision.benchmarkId, revision.revisionStr)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}


module.exports.deleteRevisionByString = async function deleteRevisionByString (req, res, next) {
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  try {
    let response = await STIG.getRevisionByString(benchmarkId, revisionStr, req.userObject)
    if(response == undefined) {
      throw new SmError.NotFoundError('No matching revision found.')

    }
    else {
      await STIG.deleteRevisionByString(benchmarkId, revisionStr, res.svcStatus)
      res.json(response)
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.deleteStigById = async function deleteStigById (req, res, next) {
  if ( req.userObject.privileges.canAdmin ) {
    try {
      let benchmarkId = req.params.benchmarkId
      let response = await STIG.deleteStigById(benchmarkId, req.userObject, res.svcStatus)
      res.json(response)
    }
    catch (err) {
      next(err)
    }
  }
  else {
    throw new SmError.PrivilegeError()
  } 
}

module.exports.getCci = async function getCci (req, res, next) {
  let cci = req.params.cci
  let projection = req.query.projection
  try {
    let response = await STIG.getCci(cci, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getCcisByRevision = async function getCcisByRevision (req, res, next) {
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  try {
    let response = await STIG.getCcisByRevision(benchmarkId, revisionStr, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getGroupByRevision = async function getGroupByRevision (req, res, next) {
  let projection = req.query.projection
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  let groupId = req.params.groupId
  try {
    let response = await STIG.getGroupByRevision(benchmarkId, revisionStr, groupId, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getGroupsByRevision = async function getGroupsByRevision (req, res, next) {
  let projection = req.query.projection
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  try {
    let response = await STIG.getGroupsByRevision(benchmarkId, revisionStr, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRevisionByString = async function getRevisionByString (req, res, next) {
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  try {
    let response = await STIG.getRevisionByString(benchmarkId, revisionStr, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRevisionsByBenchmarkId = async function getRevisionsByBenchmarkId (req, res, next) {
  let benchmarkId = req.params.benchmarkId
  try {
    let response = await STIG.getRevisionsByBenchmarkId(benchmarkId, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRuleByRuleId = async function getRuleByRuleId (req, res, next) {
  let projection = req.query.projection
  let ruleId = req.params.ruleId
  try {
    let response = await STIG.getRuleByRuleId(ruleId, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRuleByRevision = async function getRulesByRevision (req, res, next) {
  let projection = req.query.projection
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  let ruleId = req.params.ruleId
  try {
    let response = await STIG.getRuleByRevision(benchmarkId, revisionStr, ruleId, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRulesByRevision = async function getRulesByRevision (req, res, next) {
  let projection = req.query.projection
  let benchmarkId = req.params.benchmarkId
  let revisionStr = req.params.revisionStr
  try {
    let response = await STIG.getRulesByRevision(benchmarkId, revisionStr, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getSTIGs = async function getSTIGs (req, res, next) {
  let title = req.query.title
  try {
    let response = await STIG.getSTIGs(title, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getStigById = async function getStigById (req, res, next) {
  let benchmarkId = req.params.benchmarkId
  try {
    let response = await STIG.getStigById(benchmarkId, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getScapMap = async function getStigById (req, res, next) {
  res.json([
    {
      scapBenchmarkId: 'CAN_Ubuntu_18-04_STIG',
      benchmarkId: 'U_CAN_Ubuntu_18-04_STIG'
    },
    {
      scapBenchmarkId: 'Mozilla_Firefox_RHEL',
      benchmarkId: 'Mozilla_Firefox'
    },
    {
      scapBenchmarkId: 'Mozilla_Firefox_Windows',
      benchmarkId: 'Mozilla_Firefox'
    },
    {
      scapBenchmarkId: 'MOZ_Firefox_Linux',
      benchmarkId: 'MOZ_Firefox_STIG'
    },
    {
      scapBenchmarkId: 'MOZ_Firefox_Windows',
      benchmarkId: 'MOZ_Firefox_STIG'
    },    
    {
      scapBenchmarkId: 'Solaris_10_X86_STIG',
      benchmarkId: 'Solaris_10_X86'
    }
  ])
}
