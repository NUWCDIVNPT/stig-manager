'use strict';

const writer = require('../utils/writer')
const config = require('../utils/config')
const escape = require('../utils/escape')
const CollectionService = require(`../service/CollectionService`)
const AssetService = require(`../service/AssetService`)
const STIGService = require(`../service/STIGService`)
const Serialize = require(`../utils/serializers`)
const Security = require('../utils/accessLevels')
const SmError = require('../utils/error')
const Archiver = require('archiver')
const {XMLBuilder} = require("fast-xml-parser")
const {escapeForXml} = require('../utils/escape')

module.exports.defaultSettings = {
  fields: {
    detail: {
      enabled: 'always',
      required: 'always'
    },
    comment: {
      enabled: 'findings',
      required: 'findings'
    }
  },
  status: {
    canAccept: true,
    resetCriteria: 'result',
    minAcceptGrant: 3
  },
  history: {
    maxReviews: 5
  }
}

module.exports.createCollection = async function createCollection (req, res, next) {
  try {
    const projection = req.query.projection
    const elevate = req.query.elevate
    const body = req.body
    if ( elevate || req.userObject.privileges.canCreateCollection ) {
      if (!hasUniqueGrants(body.grants)) {
        throw new SmError.UnprocessableError('Duplicate user in grant array')
      }  
      try {
        const response = await CollectionService.createCollection( body, projection, req.userObject, res.svcStatus)
        res.status(201).json(response)
      }
      catch (err) {
        // This is MySQL specific, should abstract
        if (err.code === 'ER_DUP_ENTRY') {
          throw new SmError.UnprocessableError('Duplicate name exists.')
        }
        else {
          throw err
        }
      }
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteCollection = async function deleteCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const projection = req.query.projection
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Owner, true)
    const response = await CollectionService.deleteCollection(collectionId, projection, elevate, req.userObject)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportCollections = async function exportCollections (projection, elevate, userObject) {
  try {
    return await CollectionService.getCollections( {}, projection, elevate, userObject )
  }
  catch (err) {
    next(err)
  }
} 

module.exports.getChecklistByCollectionStig = async function getChecklistByCollectionStig (req, res, next) {
  try {
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionService.getChecklistByCollectionStig(collectionId, benchmarkId, revisionStr, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollection = async function getCollection (req, res, next) {
  try {
    const projection = req.query.projection
    const elevate = req.query.elevate
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted, true)
    const response = await CollectionService.getCollection(collectionId, projection, elevate, req.userObject )
    res.status(typeof response === 'undefined' ? 204 : 200).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollections = async function getCollections (req, res, next) {
  try {
    const projection = req.query.projection
    const elevate = req.query.elevate
    const name = req.query.name
    const nameMatch = req.query['name-match']
    const metadata = req.query.metadata
    const response = await CollectionService.getCollections({
      name: name,
      nameMatch: nameMatch,
      metadata: metadata
    }, projection, elevate, req.userObject)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getFindingsByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const aggregator = req.query.aggregator
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const acceptedOnly = req.query.acceptedOnly
    const projection = req.query.projection
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionService.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, projection, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getPoamByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const aggregator = req.query.aggregator
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const acceptedOnly = req.query.acceptedOnly
    const defaults = {
      date: req.query.date,
      office: req.query.office,
      status: req.query.status
    }
    const { collectionId, collectionGrant } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionService.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, 
      [
        'rulesWithDiscussion',
        'groups',
        'assets',
        'stigs',
        'ccis'
      ], req.userObject )
    
    const po = Serialize.poamObjectFromFindings(response, defaults)
    const xlsx = await Serialize.xlsxFromPoamObject(po)
    let collectionName = collectionGrant.collection.name
    writer.writeInlineFile( res, xlsx, `POAM-${collectionName}_${escape.filenameComponentFromDate()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }
  catch (err) {
    next(err)
  }
}


module.exports.getStigAssetsByCollectionUser = async function getStigAssetsByCollectionUser (req, res, next) {
  try {
    const userId = req.params.userId
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const response = await CollectionService.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigsByCollection = async function getStigsByCollection (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const labelIds = req.query.labelId
    const labelNames = req.query.labelName
    const labelMatch = req.query.labelMatch
    const projections = req.query.projection
    const response = await CollectionService.getStigsByCollection({collectionId, labelIds, labelNames, labelMatch, projections, userObject: req.userObject})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigByCollection = async function getStigByCollection (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const benchmarkId = req.params.benchmarkId
    const projections = req.query.projection
    const response = await CollectionService.getStigsByCollection({collectionId, projections, userObject: req.userObject, benchmarkId})
    if (!response[0]) {
      res.status(204)
    }
    res.json(response[0])
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceCollection = async function replaceCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const {collectionId, collectionGrant} = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage, true)
    const projection = req.query.projection
    const body = req.body
    if (!hasUniqueGrants(body.grants)) {
      throw new SmError.UnprocessableError('Duplicate user in grant array')
    }
    const existingGrants = (await CollectionService.getCollection(collectionId, ['grants'], false, req.userObject ))
      ?.grants
      .map(g => ({userId: g.user.userId, accessLevel: g.accessLevel}))

      if (!elevate && (collectionGrant.accessLevel !== Security.ACCESS_LEVEL.Owner && !requestedOwnerGrantsMatchExisting(body.grants, existingGrants))) {
        throw new SmError.PrivilegeError('Cannot create or modify owner grants.')
    }
    let response = await CollectionService.replaceCollection(collectionId, body, projection, req.userObject, res.svcStatus)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.setStigAssetsByCollectionUser = async function setStigAssetsByCollectionUser (req, res, next) {
  try {
    const userId = req.params.userId
    const stigAssets = req.body
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const collectionResponse = await CollectionService.getCollection(collectionId, ['grants'], false, req.userObject )
    if (collectionResponse.grants.filter( grant => grant.accessLevel === 1 && grant.user.userId === userId).length > 0) {
      await CollectionService.setStigAssetsByCollectionUser(collectionId, userId, stigAssets, res.svcStatus ) 
      const getResponse = await CollectionService.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
      res.json(getResponse)    
    }
    else {
      throw new SmError.NotFoundError('User not found in this Collection with accessLevel === 1.')
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.updateCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const {collectionId, collectionGrant} = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage, true)
    const projection = req.query.projection
    const body = req.body
    if (body.grants) {
      if (!hasUniqueGrants(body.grants)) {
        throw new SmError.UnprocessableError('Duplicate user in grant array')
      }
      const existingGrants = (await CollectionService.getCollection(collectionId, ['grants'], false, req.userObject ))
        ?.grants
        .map(g => ({userId: g.user.userId, accessLevel: g.accessLevel}))

      if (!elevate && (collectionGrant.accessLevel !== Security.ACCESS_LEVEL.Owner && !requestedOwnerGrantsMatchExisting(body.grants, existingGrants))) {
        throw new SmError.PrivilegeError('Cannot create or modify owner grants.')
      }
    }
    let response = await CollectionService.replaceCollection(collectionId, body, projection, req.userObject, res.svcStatus)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

function hasUniqueGrants(requestedGrants) {
  const requestedUsers = {}
  for (const grant of requestedGrants) {
    if (requestedUsers[grant.userId]) return false
    requestedUsers[grant.userId] = true
  }
  return true
}

function requestedOwnerGrantsMatchExisting(requestedGrants, existingGrants) {
  const accumulateOwners = (accumulator, currentValue) => {
    if (currentValue.accessLevel === Security.ACCESS_LEVEL.Owner) accumulator.push(currentValue.userId)
    return accumulator
  }
  const haveSameSet = (a, b) => {
    return a.every(item => b.includes(item)) && b.every(item => a.includes(item))
  }
  const existingOwners = existingGrants.reduce(accumulateOwners, [])
  const requestedOwners = requestedGrants.reduce(accumulateOwners, [])
  
  if ( existingOwners.length !== requestedOwners.length || !haveSameSet(existingOwners, requestedOwners)) {
    return false
  }
  return true
}

/**
 * Retrieves collectionId and collection grant and checks user's access grant level or elevate.
 * Also allows for elevate
 * @param {Object} request - The request object.
 * @param {number} minimumAccessLevel - The minimum access level required. Defaults to Security.ACCESS_LEVEL.Manage.
 * @param {boolean} allowElevate - Whether to allow elevation of access level. Defaults to false.
 * @returns {Object} - An object containing the collectionId and collectionGrant.
 * @throws {SmError.PrivilegeError} - If the user does not have sufficient privileges.
 */
function getCollectionInfoAndCheckPermission(request, minimumAccessLevel = Security.ACCESS_LEVEL.Manage, supportsElevation = false) {
  let collectionId = request.params.collectionId
  const elevate = request.query.elevate
  const collectionGrant = request.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
  // If elevate is not set and supported, and the user does not have a grant, or the grant level is below the minimum required, throw an error.
  if (!( (supportsElevation && elevate) || (collectionGrant?.accessLevel >= minimumAccessLevel) )) {
    throw new SmError.PrivilegeError()
  }
  return {collectionId, collectionGrant}
}

module.exports.getCollectionInfoAndCheckPermission = getCollectionInfoAndCheckPermission


module.exports.getCollectionMetadata = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let result = await CollectionService.getCollectionMetadata(collectionId, req.userObject)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchCollectionMetadata = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let metadata = req.body
    await CollectionService.patchCollectionMetadata(collectionId, metadata)
    let result = await CollectionService.getCollectionMetadata(collectionId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putCollectionMetadata = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let body = req.body
    await CollectionService.putCollectionMetadata( collectionId, body)
    let result = await CollectionService.getCollectionMetadata(collectionId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionMetadataKeys = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let result = await CollectionService.getCollectionMetadataKeys(collectionId, req.userObject)
    if (!result) {
      throw new SmError.NotFoundError('metadata keys not found')
    } 
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionMetadataValue = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let key = req.params.key
    let result = await CollectionService.getCollectionMetadataValue(collectionId, key, req.userObject)
    if (!result) {
      throw new SmError.NotFoundError('metadata key not found')
    }
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putCollectionMetadataValue = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let key = req.params.key
    let value = req.body
    await CollectionService.putCollectionMetadataValue(collectionId, key, value)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteCollectionMetadataKey = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req)
    let key = req.params.key
    await CollectionService.deleteCollectionMetadataKey(collectionId, key, req.userObject)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteReviewHistoryByCollection = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const retentionDate = req.query.retentionDate
    const assetId = req.query.assetId
    
    let result = await CollectionService.deleteReviewHistoryByCollection(collectionId, retentionDate, assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewHistoryByCollection = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Full)
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const assetId = req.query.assetId
    const ruleId = req.query.ruleId
    const status = req.query.status

    let result = await CollectionService.getReviewHistoryByCollection(collectionId, startDate, endDate, assetId, ruleId, status)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewHistoryStatsByCollection = async function (req, res, next) {
  try {
    let { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Full)
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const assetId = req.query.assetId
    const ruleId = req.query.ruleId
    const status = req.query.status
    const projection = req.query.projection

    let result = await CollectionService.getReviewHistoryStatsByCollection(collectionId, startDate, endDate, assetId, ruleId, status, projection)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionLabels = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionService.getCollectionLabels( collectionId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.createCollectionLabel = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const labelId = await CollectionService.createCollectionLabel( collectionId, req.body )
    const response = await CollectionService.getCollectionLabelById( collectionId, labelId, req.userObject )
    res.status(201).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollectionLabelById = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionService.getCollectionLabelById( collectionId, req.params.labelId, req.userObject )
    if (!response) {
      throw new SmError.NotFoundError()
    }
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.patchCollectionLabelById = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const affectedRows = await CollectionService.patchCollectionLabelById( collectionId, req.params.labelId, req.body )
    if (affectedRows === 0) {
      throw new SmError.NotFoundError()
    }
    const response = await CollectionService.getCollectionLabelById( collectionId, req.params.labelId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteCollectionLabelById = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const affectedRows = await CollectionService.deleteCollectionLabelById(collectionId, req.params.labelId)
    if (affectedRows === 0) {
      throw new SmError.NotFoundError()
    }
    res.status(204).end()
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssetsByCollectionLabelId = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await CollectionService.getAssetsByCollectionLabelId( collectionId, req.params.labelId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.putAssetsByCollectionLabelId = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const labelId = req.params.labelId
    const assetIds = req.body
    let collection = await CollectionService.getCollection( collectionId, ['assets','labels'], false, req.userObject)

    if (!collection.labels.find( l => l.labelId === labelId)) {
      throw new SmError.PrivilegeError('The labelId is not associated with this Collection.')
    }

    let collectionAssets = collection.assets.map( a => a.assetId)
    if (assetIds.every( a => collectionAssets.includes(a))) {
      await CollectionService.putAssetsByCollectionLabelId( collectionId, labelId, assetIds, res.svcStatus )
      const response = await CollectionService.getAssetsByCollectionLabelId( collectionId, req.params.labelId, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('One or more assetId is not a Collection member.')
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.postCklArchiveByCollection = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const mode = req.query.mode || 'mono'
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, mode, req.userObject)
    await postArchiveByCollection({
      format: `ckl-${mode}`,
      req,
      res,
      parsedRequest
    })
  }
  catch (err) {
    next(err)
  }
}

module.exports.postCklbArchiveByCollection = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const mode = req.query.mode || 'mono'
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, mode, req.userObject)
    await postArchiveByCollection({
      format: `cklb-${mode}`,
      req,
      res,
      parsedRequest
    })
  }
  catch (err) {
    next(err)
  }
}

module.exports.postXccdfArchiveByCollection = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, 'mono', req.userObject)
    await postArchiveByCollection({
      format: 'xccdf',
      req,
      res,
      parsedRequest
    })
  }
  catch (err) {
    next(err)
  }
}

async function postArchiveByCollection ({format = 'ckl-mono', req, res, parsedRequest}) {
  req.noCompression = true
  const builder = new XMLBuilder({
    attributeNamePrefix : "@_",
    textNodeName : "#text",
    ignoreAttributes: format.startsWith('ckl-'),
    cdataTagName: "__cdata",
    cdataPositionChar: "\\c",
    format: true,
    indentBy: "  ",
    supressEmptyNode: format === 'xccdf',
    processEntities: false,
    tagValueProcessor: escapeForXml,
    attrValueProcessor: escapeForXml
})
  const zip = Archiver('zip', {zlib: {level: 9}})
  const started = new Date()
  const dateString = escape.filenameComponentFromDate(started)
  const attachmentName = escape.escapeFilename(`${parsedRequest.collection.name}-${format.startsWith('ckl-') ? 
    'CKL' : format.startsWith('cklb-') ? 'CKLB' : 'XCCDF'}_${dateString}.zip`)
  res.attachment(attachmentName)
  zip.pipe(res)
  const manifest = {
    started: started.toISOString(),
    finished: '',
    errorCount: 0,
    errors: [],
    memberCount: 0,
    members: [],
    requestParams: {
      collection: parsedRequest.collection,
      assetStigs: req.body
    }
  }

  zip.on('error', function (e) {
    manifest.errors.push({message: e.message, stack: e.stack})
    manifest.errorCount += 1
  })
  for (const arg of parsedRequest.assetStigArguments) {
    try {
      let response
      switch (format) {
        case 'ckl-mono':
        case 'ckl-multi':
          response = await AssetService.cklFromAssetStigs(arg.assetId, arg.stigs)
          break
        case 'cklb-mono':
        case 'cklb-multi':
          response = await AssetService.cklbFromAssetStigs(arg.assetId, arg.stigs)
          break
        case 'xccdf':
          response = await AssetService.xccdfFromAssetStig(arg.assetId, arg.stigs[0].benchmarkId, arg.stigs[0].revisionStr)
      }
      let data
      if (response.xmlJs) {
        data = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n<!-- Classification: ${config.settings.setClassification} -->\n`
        data += builder.build(response.xmlJs)  
      }
      else {
        data = JSON.stringify(response.cklb)
      }
      let filename = arg.assetName
      if (format === 'ckl-mono' || format === 'cklb-mono' || format === 'xccdf') {
        filename += `-${arg.stigs[0].benchmarkId}-${response.revisionStrResolved}`
      }
      filename += `${format === 'xccdf' ? '-xccdf.xml' : format.startsWith('ckl-') ? '.ckl' : '.cklb'}`
      filename = escape.escapeFilename(filename)
      zip.append(data, {name: filename})
      manifest.members.push(filename)
      manifest.memberCount += 1
    }
    catch (e) {
      arg.error = {message: e.message, stack: e.stack}
      manifest.errors.push(arg)
      manifest.errorCount += 1
    }
  }
  manifest.finished = new Date().toISOString()
  manifest.members.sort((a,b) => a.localeCompare(b))
  zip.append(JSON.stringify(manifest, null, 2), {name: '_manifest.json'})
  await zip.finalize()
}

module.exports.getUnreviewedAssetsByCollection = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const severities = req.query.severity || []
    const labelIds = req.query.labelId || []
    const labelNames = req.query.labelName || []
    const projections = req.query.projection || []
    const response = await CollectionService.getUnreviewedAssetsByCollection( {
      collectionId,
      benchmarkId,
      assetId,
      labelIds,
      labelNames,
      severities,
      projections,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getUnreviewedRulesByCollection = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const benchmarkId = req.query.benchmarkId
    const ruleId = req.query.ruleId
    const severities = req.query.severity || []
    const labelIds = req.query.labelId || []
    const labelNames = req.query.labelName || []
    const projections = req.query.projection || []
    const response = await CollectionService.getUnreviewedRulesByCollection( {
      collectionId,
      benchmarkId,
      ruleId,
      severities,
      labelIds,
      labelNames,
      projections,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

// for the archive streaming endpoints
async function processAssetStigRequests (assetStigRequests, collectionId, mode = 'mono', userObject) {
  const assetStigArguments = []
  let collectionName

  // Pre-fetch the available revisions of STIGs that were accompanied by a requested revision

  // Build a Set of the requested STIGs that were accomapnied by a requested revision
  const requestedStigRevisionsSet = assetStigRequests.reduce((acc, value) => {
    if (value.stigs) {
      for (const item of value.stigs) {
        if (typeof item !== 'string') {
          acc.add(item.benchmarkId)
        }
      }
    }
    return acc
  }, new Set())
  const requestedStigRevisionsArray = [...requestedStigRevisionsSet]
  // Create an object that can have benchmarkId properties and values of revisionStr arrays
  let availableRevisions = {}
  if (requestedStigRevisionsArray.length) {
    availableRevisions = await STIGService.getRevisionStrsByBenchmarkIds(requestedStigRevisionsArray)
  }

  // iterate through the request
  for (const requested of assetStigRequests) {
    const assetId = requested.assetId
    
    // Try to fetch asset as this user.
    const assetResponse = await AssetService.getAsset(assetId, ['stigs'], false, userObject )
    // Does user have a grant permitting access to the asset?
    if (!assetResponse) {
      throw new SmError.PrivilegeError()
    }
    // Is asset a member of collectionId?
    if (assetResponse.collection.collectionId !== collectionId) {
      throw new SmError.UnprocessableError(`Asset id ${assetId} is not a member of Collection id ${collectionId}.`)
    }
    if (!collectionName) { collectionName = assetResponse.collection.name } // will be identical for other assets
    // Does the asset have STIG assignments?
    if (assetResponse.stigs.length === 0) {
      throw new SmError.UnprocessableError(`Asset id ${assetId} has no STIG assignments.`)
    }

    // create Set with keys being the asset's benchmarkId assignments
    const assignedStigsSet = new Set(assetResponse.stigs.map( stig => stig.benchmarkId))

    // create Map with keys being the requested benchmarkIds for the asset and values being an array of requested revisionStrs for that benchmarkId
    const requestedRevisionsMap = new Map()

    if (!requested.stigs) {
      // request doesn't specify STIGs, so create keys for each assigned benchmarkId and set each value to an array containing the default revision string
      for (const stig of assetResponse.stigs) {
        requestedRevisionsMap.set(stig.benchmarkId, [stig.revisionStr])
      } 
    }
    else {
      // request includes specific STIGs
      for (const stig of requested.stigs) {
        if (typeof stig === 'string' && assignedStigsSet.has(stig)) {
          // value is a benchmarkId string that matches an available STIG mapping

          // get already requested revisions for this STIG or any empty array
          const revisions = requestedRevisionsMap.get(stig) ?? []
          // add the default revision string to the requested revisions
          revisions.push(assetResponse.stigs.find( assetStig => assetStig.benchmarkId === stig).revisionStr)
          // update the Map
          requestedRevisionsMap.set(stig, revisions)
        }
        else if ((stig.revisionStr === 'latest' && assignedStigsSet.has(stig.benchmarkId)) || 
          (assignedStigsSet.has(stig.benchmarkId) && availableRevisions[stig.benchmarkId].includes(stig.revisionStr))) {
          // value is an object that matches an available STIG/Revision mapping

          // get already requested revisions for this STIG or any empty array
          const revisions = requestedRevisionsMap.get(stig.benchmarkId) ?? []
          // add this requested revision string to the requested revisions
          revisions.push(stig.revisionStr)
          // update the Map
          requestedRevisionsMap.set(stig.benchmarkId, revisions)
        }
        else {
          throw new SmError.UnprocessableError(`Asset id ${assetId} is not mapped to ${JSON.stringify(stig)}.`)
        }
      }
    }

    // For generating individual filenames
    const assetName = assetResponse.name

    if (mode === 'mono') {
      // XCCDF and mono CKLs
      for (const entry of requestedRevisionsMap) {
        for (const revisionStr of entry[1]) {
          assetStigArguments.push({
            assetId,
            assetName,
            stigs: [{benchmarkId: entry[0], revisionStr}]
          }) 
        }
      }
    }
    else {
      // multi-STIG CKLs
      const stigsParam = []
      for (const entry of requestedRevisionsMap) {
        for (const revisionStr of entry[1]) {
          stigsParam.push({benchmarkId: entry[0], revisionStr})
        }
      }
      assetStigArguments.push({
        assetId,
        assetName,
        stigs: stigsParam
      })
    }
  }
  return {
    collection: {
      collectionId,
      name: collectionName,
    },
    assetStigArguments
  }
}

module.exports.writeStigPropsByCollectionStig = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const benchmarkId = req.params.benchmarkId
    const assetIds = req.body.assetIds
    const defaultRevisionStr = req.body.defaultRevisionStr
    const existingRevisions = await STIGService.getRevisionsByBenchmarkId(benchmarkId, req.userObject)
    //if defaultRevisionStr is present, check that specified revision is valid for the benchmark
    if (defaultRevisionStr && defaultRevisionStr !== "latest" && existingRevisions.find(benchmark => benchmark.revisionStr === defaultRevisionStr) === undefined) {
      throw new SmError.UnprocessableError("The revisionStr is is not valid for the specified benchmarkId")
    }
    // The OAS layer mandated if assetIds is absent then defaultRevisionStr must be present
    // we do not permit setting the default revision of an unassigned STIG
    if (!assetIds && !await CollectionService.doesCollectionIncludeStig({collectionId, benchmarkId})) {
      throw new SmError.UnprocessableError('Cannot set the default revision of a benchmarkId that has no mapped Assets')
    }
    if (assetIds && assetIds.length === 0 && defaultRevisionStr) {
      throw new SmError.UnprocessableError('Cannot set the default revision of a benchmarkId and also remove all mapped Assets')
    }
    if (assetIds?.length) {
      const collectionHasAssets = await CollectionService.doesCollectionIncludeAssets({
        collectionId,
        assetIds
      })
      if (!collectionHasAssets) {
        throw new SmError.PrivilegeError('One or more assetId is not a Collection member.')
      }
    }
    await CollectionService.writeStigPropsByCollectionStig( {
      collectionId,
      benchmarkId,
      assetIds,
      defaultRevisionStr,
      svcStatus: res.svcStatus
    })
    const response = await CollectionService.getStigsByCollection({collectionId, userObject: req.userObject, benchmarkId})
    if (response[0]) {
      res.json(response[0])
    }
    else {
      res.status(204).send()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.cloneCollection = async function (req, res, next) {
  try {
    function progressCb(json) {
      res.write(JSON.stringify(json) + '\n')
    }
    if ( req.userObject.privileges.canCreateCollection ) {
      const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
      const options = {
        grants: true,
        labels: true,
        assets: true,
        stigMappings: 'withReviews',
        pinRevisions: 'matchSource',
        ...req.body.options
      }

      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      req.noCompression = true

      const cloned = await CollectionService.cloneCollection({
        collectionId, 
        userObject: req.userObject, 
        name: req.body.name,
        description: req.body.description,
        options, 
        svcStatus: res.svcStatus,
        progressCb
      })
      if (cloned) {
        const collection = await CollectionService.getCollection(cloned.destCollectionId, req.query.projection, false, req.userObject )
        res.write(JSON.stringify({stage: 'result', collection}) + '\n')
      }
      res.end()
    }
    else {
      throw new SmError.PrivilegeError('User has not been granted createCollection privilege')
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportToCollection = async function (req, res, next) {
  try {
    function progressCb(json) {
      res.write(JSON.stringify(json) + '\n')
    }

    const { collectionId: srcCollectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    req.params.collectionId = req.params.dstCollectionId
    const { collectionId: dstCollectionId } = getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    req.params.collectionId = srcCollectionId
    const parsedRequest = await processAssetStigRequests (req.body, srcCollectionId, 'multi', req.userObject)
    
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    req.noCompression = true

    await CollectionService.exportToCollection({
      srcCollectionId,
      dstCollectionId,
      assetStigArguments: parsedRequest.assetStigArguments,
      userObject: req.userObject, 
      progressCb,
      svcStatus: res.svcStatus
    })
    res.end()
  }
  catch (err) {
    next(err)
  }
}
