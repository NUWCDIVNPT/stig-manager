'use strict';

const writer = require('../utils/writer')
const config = require('../utils/config')
const escape = require('../utils/escape')
const CollectionService = require(`../service/CollectionService`)
const AssetService = require(`../service/AssetService`)
const STIGService = require(`../service/STIGService`)
const UserService = require(`../service/UserService`)
const Serialize = require(`../utils/serializers`)
const Security = require('../utils/roles')
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
    if ( elevate || req.userObject.privileges.create_collection ) {
      if (!hasUniqueGrants(body.grants)) {
        throw new SmError.UnprocessableError('Duplicate user or user group in grant array')
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
    const projections = req.query.projection
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Owner, true)
    const response = await CollectionService.getCollection(collectionId, projections, elevate, req.userObject)
    await CollectionService.deleteCollection(collectionId, req.userObject.userId)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportCollections = async function exportCollections (projection, elevate, userObject) {
  try {
    return await CollectionService.queryCollections({projection, elevate})
  }
  catch (err) {
    next(err)
  }
} 

module.exports.getChecklistByCollectionStig = async function getChecklistByCollectionStig (req, res, next) {
  try {
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
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
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted, true)
    const response = await CollectionService.getCollection(collectionId, projection, elevate, req.userObject )
    res.status(typeof response === 'undefined' ? 204 : 200).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollections = async function getCollections (req, res, next) {
  try {
    const projections = req.query.projection
    const elevate = req.query.elevate
    const name = req.query.name
    const nameMatch = req.query['name-match']
    const metadata = req.query.metadata
    const response = await CollectionService.queryCollections({
      filter: {name, nameMatch, metadata},
      projections,
      elevate,
      grants: req.userObject.grants,
      userId: req.userObject.userId
    })
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
    const projections = req.query.projection
    const {collectionId, grant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const response = await CollectionService.getFindingsByCollection({collectionId, aggregator, benchmarkId, assetId, acceptedOnly, projections, grant})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getPoamByCollection = async function getPoamByCollection (req, res, next) {
  try {
    const {
      aggregator, 
      benchmarkId, 
      assetId, 
      acceptedOnly, 
      date, 
      office, 
      status, 
      mccastPackageId, 
      mccastAuthName, 
      format
    } = req.query
    const defaults = {
      date, 
      office, 
      status, 
      mccastPackageId, 
      mccastAuthName
    }
    const {collectionId, grant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const findings = await CollectionService.getFindingsByCollection({
      collectionId, aggregator, benchmarkId, assetId, acceptedOnly, 
      projections: [
        'rulesWithDiscussion',
        'groups',
        'assets',
        'stigs',
        'ccis'
      ],
      grant})
    
    const poFns = {
      EMASS: Serialize.poamObjectFromFindings,
      MCCAST: Serialize.mccastPoamObjectFromFindings
    }
    const xlsx = await Serialize.xlsxFromPoamObject(poFns[format](findings, defaults), format)
    writer.writeInlineFile( res, xlsx, `POAM-${format}-${grant.name}_${escape.filenameComponentFromDate()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }
  catch (err) {
    next(err)
  }
}

// module.exports.getStigAssetsByCollectionUser = async function getStigAssetsByCollectionUser (req, res, next) {
//   try {
//     const userId = req.params.userId
//     const { collectionId } = getCollectionInfoAndCheckPermission(req)
//     const response = await CollectionService.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
//     res.json(response)
//   }
//   catch (err) {
//     next(err)
//   }
// }

module.exports.getStigsByCollection = async function getStigsByCollection (req, res, next) {
  try {
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const labelIds = req.query.labelId
    const labelNames = req.query.labelName
    const labelMatch = req.query.labelMatch
    const projections = req.query.projection
    const response = await CollectionService.getStigsByCollection({collectionId, labelIds, labelNames, labelMatch, projections, grant})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigByCollection = async function getStigByCollection (req, res, next) {
  try {
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const benchmarkId = req.params.benchmarkId
    const projections = req.query.projection
    const response = await CollectionService.getStigsByCollection({collectionId, projections, grant, benchmarkId})
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
    const {collectionId, grant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const projection = req.query.projection
    const body = req.body
    if (!hasUniqueGrants(body.grants)) {
      throw new SmError.UnprocessableError('Duplicate user in grant array')
    }
    const existingGrants = (await CollectionService.getCollection(collectionId, ['grants'], false, req.userObject))
    ?.grants
    .map(g => {
      const flattenedGrant = {roleId: g.roleId}
      if (g.user) {
        flattenedGrant.userId = g.user.userId
      }
      else {
        flattenedGrant.userGroupId = g.userGroup.userGroupId
      }
      return flattenedGrant
    })

      if (!elevate && (grant.roleId !== Security.ROLES.Owner && !requestedOwnerGrantsMatchExisting(body.grants, existingGrants))) {
        throw new SmError.PrivilegeError('Cannot create or modify owner grants.')
    }
    let response = await CollectionService.replaceCollection(collectionId, body, projection, req.userObject, res.svcStatus)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.updateCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const {collectionId, grant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const projection = req.query.projection
    const body = req.body
    if (body.grants) {
      if (!hasUniqueGrants(body.grants)) {
        throw new SmError.UnprocessableError('Duplicate user in grant array')
      }
      const existingGrants = (await CollectionService.getCollection(collectionId, ['grants'], false, req.userObject ))
        ?.grants
        .map(g => {
          const flattenedGrant = {roleId: g.roleId}
          if (g.user) {
            flattenedGrant.userId = g.user.userId
          }
          else {
            flattenedGrant.userGroupId = g.userGroup.userGroupId
          }
          return flattenedGrant
        })

      if (!elevate && (grant.roleId !== Security.ROLES.Owner && !requestedOwnerGrantsMatchExisting(body.grants, existingGrants))) {
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
  const userItems = {}
  const userGroupItems = {}
  for (const grant of requestedGrants) {
    if (userItems[grant.userId]) return false
    if (userGroupItems[grant.userGroupId]) return false
    const itemsObject = grant.userId ? userItems : userGroupItems
    itemsObject[grant.userId ?? grant.userGroupId] = true
  }
  return true
}

function requestedOwnerGrantsMatchExisting(requestedGrants, existingGrants) {
  const accumulateOwners = (accumulator, currentValue) => {
    if (currentValue.roleId === Security.ROLES.Owner) 
      accumulator.push(currentValue.userId ? `U${currentValue.userId}` : `UG${currentValue.userGroupId}`)
    return accumulator
  }
  const haveSameSet = (a, b) => {
    return a.every(item => b.includes(item)) && b.every(item => a.includes(item))
  }
  const existingOwners = existingGrants.reduce(accumulateOwners, [])
  const requestedOwners = requestedGrants.reduce(accumulateOwners, [])
  
  return !(existingOwners.length !== requestedOwners.length || !haveSameSet(existingOwners, requestedOwners))
}

/**
 * Retrieves collectionId and collection grant and checks user's access grant level or elevate.
 * Also allows for elevate
 * @param {Object} request - The request object.
 * @param {number} minimumRole - The minimum rokle required. Defaults to Security.ROLES.Manage.
 * @param {boolean} allowElevate - Whether to allow elevation of access level. Defaults to false.
 * @returns {Object} - An object containing the collectionId and grant.
 * @throws {SmError.PrivilegeError} - If the user does not have sufficient privileges.
 */
function getCollectionInfoAndCheckPermission(request, minimumRole = Security.ROLES.Manage, supportsElevation = false) {
  let collectionId = request.params.collectionId
  const elevate = request.query.elevate
  const grant = request.userObject.grants[collectionId]

  // If elevate is not set and supported, and the user does not have a grant, or the grant level is below the minimum required, throw an error.
  if (!( (supportsElevation && elevate) || (grant?.roleId >= minimumRole) )) {
    throw new SmError.PrivilegeError()
  }
  return {collectionId, grant}
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
    let { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
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
    let { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Full)
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
    let { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Full)
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const response = await CollectionService.getCollectionLabels( collectionId, grant )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.createCollectionLabel = async function (req, res, next) {
  try {
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
    const labelId = await CollectionService.createCollectionLabel( collectionId, req.body )
    const response = await CollectionService.getCollectionLabelById( collectionId, labelId, grant )
    res.status(201).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollectionLabelById = async function (req, res, next) {
  try {
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const response = await CollectionService.getCollectionLabelById( collectionId, req.params.labelId, grant )
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
    const affectedRows = await CollectionService.patchCollectionLabelById( collectionId, req.params.labelId, req.body )
    if (affectedRows === 0) {
      throw new SmError.NotFoundError()
    }
    const response = await CollectionService.getCollectionLabelById( collectionId, req.params.labelId, grant )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteCollectionLabelById = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
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
    const {collectionId, grant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const response = await CollectionService.getAssetsByCollectionLabelId( collectionId, req.params.labelId, grant )
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const mode = req.query.mode || 'mono'
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, mode, grant)
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const mode = req.query.mode || 'mono'
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, mode, grant)
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const parsedRequest = await processAssetStigRequests (req.body, collectionId, 'mono', grant)
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
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
      grant,
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
    const {collectionId, grant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
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
      grant,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

// for the archive streaming endpoints
async function processAssetStigRequests (assetStigRequests, collectionId, mode = 'mono', grant) {
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
    const assetResponse = await AssetService.getAsset({assetId, projections: ['stigs'], grant} )
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
    const { collectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
    const benchmarkId = req.params.benchmarkId
    const assetIds = req.body.assetIds
    const defaultRevisionStr = req.body.defaultRevisionStr
    const existingRevisions = await STIGService.getRevisionsByBenchmarkId({benchmarkId, grants: req.userObject.grants})
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
    const response = await CollectionService.getStigsByCollection({collectionId, grant, benchmarkId})
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
    if ( req.userObject.privileges.create_collection ) {
      const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
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
        // // hack the existing userObject
        req.userObject.grants[cloned.destCollectionId] = {
          collectionId: cloned.destCollectionId,
          name: req.body.name,
          roleId: 4,
          grantIds: []
        }
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

    const { collectionId: srcCollectionId, grant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    req.params.collectionId = req.params.dstCollectionId
    const { collectionId: dstCollectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
    req.params.collectionId = srcCollectionId
    const parsedRequest = await processAssetStigRequests (req.body, srcCollectionId, 'multi', grant)
    
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

module.exports.getEffectiveAclByCollectionUser =  async function (req, res, next) {
  try{
    const {collectionId} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
    const userId = req.params.userId
    if (!await CollectionService._hasCollectionGrant({collectionId, userId})) throw new SmError.UnprocessableError('user has no direct or group grant in collection')
    const response = await CollectionService.getEffectiveAclByCollectionUser({collectionId, userId})
    res.json(response)
  }
  catch(err){
    next(err)
   }
}

module.exports.putGrantByCollectionGrant = async function (req, res, next) {
  try {
    const grantId = req.params.grantId
    const elevate = req.query.elevate
    const grant = req.body

    const {collectionId, grant: requesterGrant} = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const currentGrant = (await CollectionService._getCollectionGrant({collectionId, grantId}))[0]
    if (!currentGrant) {
      throw new SmError.NotFoundError('no such grant in collection')
    }
    if (!elevate && currentGrant.roleId === 4 && requesterGrant.roleId !== 4) {
      throw new SmError.PrivilegeError('cannot modify owner grants')
    }
    if (!elevate && grant.roleId === 4 && requesterGrant.roleId !== 4) {
      throw new SmError.PrivilegeError('cannot create owner grants')
    }
    
    await CollectionService.putGrantById({grantId, grant, isRoleChange: currentGrant.roleId !== grant.roleId, svcStatus: res.svcStatus})
    const updatedGrant = (await CollectionService._getCollectionGrant({collectionId, grantId}))[0]
    res.json(updatedGrant)
  }
  catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      err = new SmError.UnprocessableError('no such grantee')
    }
    else if (err.code === 'ER_DUP_ENTRY') {
      err = new SmError.UnprocessableError('grantee has a conflicting grant')
    }
    next(err)
  }
}

module.exports.getGrantByCollectionGrant = async function (req, res, next) {
  try {
    const grantId = req.params.grantId
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const grant = (await CollectionService._getCollectionGrant({collectionId, grantId}))[0]
    if (!grant) throw new SmError.NotFoundError('no such grant in collection')
    res.json(grant)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getGrantsByCollection = async function (req, res, next) {
  try {
    const { collectionId } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const grants = await CollectionService._getCollectionGrant({collectionId})
    res.json(grants)
  }
  catch (err) {
    next(err)
  }
}

module.exports.postGrantsByCollection = async function (req, res, next) {
  try {
    const { collectionId, grant: requesterGrant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const grants = req.body
    const elevate = req.query.elevate
    const roles = grants.map( g => g.roleId)
    if (!elevate && roles.includes(4) && requesterGrant.roleId !== 4) {
      throw new SmError.PrivilegeError('cannot create owner grants')
    }
    const grantIds = await CollectionService.postGrantsByCollection(collectionId, grants)
    const newGrants = await CollectionService._getCollectionGrant({collectionId, grantIds})
    res.status(201).json(newGrants)
  }
  catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      err = new SmError.UnprocessableError('no such grantee')
    }
    else if (err.code === 'ER_DUP_ENTRY') {
      err = new SmError.UnprocessableError('grantee has a conflicting grant')
    }
    next(err)
  }
}

module.exports.deleteGrantByCollectionGrant = async function (req, res, next) {
  try {
    const grantId = req.params.grantId
    const elevate = req.query.elevate
    const { collectionId, grant: requesterGrant } = getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage, true)
    const currentGrant = (await CollectionService._getCollectionGrant({collectionId, grantId}))[0]
    if (!currentGrant) {
      throw new SmError.NotFoundError('no such grant in collection')
    }
    if (!elevate && currentGrant.roleId === 4 && requesterGrant.roleId !== 4) {
      throw new SmError.PrivilegeError('cannot remove owner grants')
    }
    await CollectionService.deleteGrantById(grantId)
    res.json(currentGrant)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAclRulesByCollectionGrant = async function (req, res, next) {
  try {
    const grantId = req.params.grantId
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const grant = (await CollectionService._getCollectionGrant({collectionId, grantId}))[0]
    if (!grant) throw new SmError.NotFoundError('no such grant in collection')
    const response = await CollectionService.queryReviewAcl({grantId})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.putAclRulesByCollectionGrant = async function (req, res, next) {
  try {
    const grantId = req.params.grantId
    const { collectionId } = getCollectionInfoAndCheckPermission(req)
    const grant = (await CollectionService._getCollectionGrant({collectionId, grantId}))[0]
    if (!grant) throw new SmError.NotFoundError('no such grant in collection')
    const acl = req.body
    const validated = await CollectionService._reviewAclValidate({grantId, acl})
    if (validated.fail.length > 0) {
      throw new SmError.UnprocessableError(validated.fail)
    }
    await CollectionService.setValidatedAcl({
      validatedAcl: validated.pass,
      grantId,
      attributionUserId: req.userObject.userId,
      svcStatus: res.svcStatus
    })
    const response = await CollectionService.queryReviewAcl({grantId})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}
