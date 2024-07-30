'use strict';

const config = require('../utils/config');
const SmError = require('../utils/error');
const parsers = require('../utils/parsers.js')
const STIGService = require(`../service/STIGService`)

module.exports.importBenchmark = async function importManualBenchmark (req, res, next) {
  try {
    if (!req.query.elevate) throw new SmError.PrivilegeError()
    const extension = req.file.originalname.substring(req.file.originalname.lastIndexOf(".")+1)
    const clobber = req.query.clobber ?? false
    if (extension.toLowerCase() != 'xml') {
      throw new SmError.ClientError(`File extension .${extension} not supported`)
    }
    let benchmark
    try {
      benchmark = parsers.benchmarkFromXccdf(req.file.buffer)
    }
    catch(err){
      throw new SmError.ClientError(err.message)
    }
    if (benchmark.scap) {
      throw new SmError.UnprocessableError('SCAP Benchmarks are not imported.')
    }
    const revision = await STIGService.insertManualBenchmark(benchmark, clobber, res.svcStatus)
    res.json(revision)
  }
  catch(err) {
    next(err)
  }
}


module.exports.deleteRevisionByString = async function deleteRevisionByString (req, res, next) {
  if ( req.query.elevate ) {
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const force = req.query.force
    try {
      const response = await STIGService.getRevisionByString(benchmarkId, revisionStr, req.userObject, true)
      if(response === undefined) {
        throw new SmError.NotFoundError('No matching revisionStr found.')
      }
      const existingRevisions = await STIGService.getRevisionsByBenchmarkId(benchmarkId, req.userObject)
      const stigAssigned = await STIGService.getStigById(benchmarkId, req.userObject, true)
      if (stigAssigned.collectionIds.length && existingRevisions.length == 1 && !force) {
        throw new SmError.UnprocessableError("The revisionStr is the last remaining revision for this benchmark, which is assigned to one or more Collections. Set force=true to force the delete")
      }      
      if (response.collectionIds.length && !force) {
        throw new SmError.UnprocessableError("The revisionStr is pinned to one or more Collections. Set force=true to force the delete")
      }
      else {
        await STIGService.deleteRevisionByString(benchmarkId, revisionStr, res.svcStatus)
        res.json(response)
      }
    }
    catch(err) {
      next(err)
    }
  }
  else {
    next(new SmError.PrivilegeError())
  } 
}

module.exports.deleteStigById = async function deleteStigById (req, res, next) {
  if ( req.query.elevate ) {
    try {
      const benchmarkId = req.params.benchmarkId
      const force = req.query.force
      const response = await STIGService.getStigById(benchmarkId, req.userObject, true)
      if(response === undefined) {
        throw new SmError.NotFoundError('No matching benchmarkId found.')
      }
      if (response.collectionIds.length && !force) {
        throw new SmError.UnprocessableError("The benchmarkId is assigned to one or more Collections. Set force=true to force the delete")
      }
      await STIGService.deleteStigById(benchmarkId, res.svcStatus)
      res.json(response)
    }
    catch (err) {
      next(err)
    }
  }
  else {
    next(new SmError.PrivilegeError())
  } 
}

module.exports.getCci = async function getCci (req, res, next) {
  let cci = req.params.cci
  let projection = req.query.projection
  try {
    let response = await STIGService.getCci(cci, projection, req.userObject)
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
    let response = await STIGService.getCcisByRevision(benchmarkId, revisionStr, req.userObject)
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
    let response = await STIGService.getGroupByRevision(benchmarkId, revisionStr, groupId, projection, req.userObject)
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
    let response = await STIGService.getGroupsByRevision(benchmarkId, revisionStr, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRevisionByString = async function getRevisionByString (req, res, next) {
  const benchmarkId = req.params.benchmarkId
  const revisionStr = req.params.revisionStr
  const elevate = req.query.elevate
  try {
    const response = await STIGService.getRevisionByString(benchmarkId, revisionStr, req.userObject, elevate)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getRevisionsByBenchmarkId = async function getRevisionsByBenchmarkId (req, res, next) {
  const benchmarkId = req.params.benchmarkId
  const elevate = req.query.elevate
  try {
    const response = await STIGService.getRevisionsByBenchmarkId(benchmarkId, req.userObject, elevate)
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
    let response = await STIGService.getRuleByRuleId(ruleId, projection, req.userObject)
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
    let response = await STIGService.getRuleByRevision(benchmarkId, revisionStr, ruleId, projection, req.userObject)
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
    let response = await STIGService.getRulesByRevision(benchmarkId, revisionStr, projection, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getSTIGs = async function getSTIGs (req, res, next) {
  const title = req.query.title
  const elevate = req.query.elevate
  const projection = req.query.projection || []
  try {
    let response = await STIGService.getSTIGs(title, projection, req.userObject, elevate)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getStigById = async function getStigById (req, res, next) {
  let benchmarkId = req.params.benchmarkId
  const elevate = req.query.elevate
  try {
    let response = await STIGService.getStigById(benchmarkId, req.userObject, elevate)
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
