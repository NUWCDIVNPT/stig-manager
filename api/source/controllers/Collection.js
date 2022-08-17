'use strict';

const writer = require('../utils/writer')
const config = require('../utils/config')
const Collection = require(`../service/${config.database.type}/CollectionService`)
const AssetSvc = require(`../service/${config.database.type}/AssetService`)
const Serialize = require(`../utils/serializers`)
const Security = require('../utils/accessLevels')
const SmError = require('../utils/error')
const Archiver = require('archiver')
const J2X = require("fast-xml-parser").j2xParser
const he = require('he')


module.exports.createCollection = async function createCollection (req, res, next) {
  try {
    const projection = req.query.projection
    const elevate = req.query.elevate
    const body = req.body
    if ( elevate || req.userObject.privileges.canCreateCollection ) {
      try {
        const response = await Collection.createCollection( body, projection, req.userObject)
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
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (elevate || (collectionGrant && collectionGrant.accessLevel === 4)) {
      const response = await Collection.deleteCollection(collectionId, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportCollections = async function exportCollections (projection, elevate, userObject) {
  try {
    return await Collection.getCollections( {}, projection, elevate, userObject )
  }
  catch (err) {
    next(err)
  }
} 

module.exports.getChecklistByCollectionStig = async function getChecklistByCollectionStig (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getChecklistByCollectionStig(collectionId, benchmarkId, revisionStr, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollection = async function getCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const elevate = req.query.elevate
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess || elevate ) {
      const response = await Collection.getCollection(collectionId, projection, elevate, req.userObject )
      res.status(typeof response === 'undefined' ? 204 : 200).json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
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
    const response = await Collection.getCollections({
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
    const collectionId = req.params.collectionId
    const aggregator = req.query.aggregator
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const acceptedOnly = req.query.acceptedOnly
    const projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, projection, req.userObject )
      res.json(response)
      }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getPoamByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const aggregator = req.query.aggregator
    const benchmarkId = req.query.benchmarkId
    const assetId = req.query.assetId
    const acceptedOnly = req.query.acceptedOnly
    const defaults = {
      date: req.query.date,
      office: req.query.office,
      status: req.query.status
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, 
        [
          'rulesWithDiscussion',
          'groups',
          'assets',
          'stigsInfo',
          'ccis'
        ], req.userObject )
      
      const po = Serialize.poamObjectFromFindings(response, defaults)
      const xlsx = await Serialize.xlsxFromPoamObject(po)
      let collectionName
      if (!collectionGrant && req.userObject.privileges.globalAccess) {
        const response = await Collection.getCollection(collectionId, [], false, req.userObject )
        collectionName = response.name
      }
      else {
        collectionName = collectionGrant.collection.name
      }
      writer.writeInlineFile( res, xlsx, `POAM-${collectionName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStatusByCollection = async function getStatusByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const benchmarkIds = req.query.benchmarkId
    const assetIds = req.query.assetId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getStatusByCollection( collectionId, assetIds, benchmarkIds, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigAssetsByCollectionUser = async function getStigAssetsByCollectionUser (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const userId = req.params.userId
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant && collectionGrant.accessLevel >= 3 ) {
      const response = await Collection.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigsByCollection = async function getStigsByCollection (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const labelIds = req.query.labelId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getStigsByCollection( collectionId, labelIds, false, req.userObject )
      res.json(response)
      }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      const response = await Collection.replaceCollection(collectionId, body, projection, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }    
  }
  catch (err) {
    next(err)
  }
}

module.exports.setStigAssetsByCollectionUser = async function setStigAssetsByCollectionUser (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const userId = req.params.userId
    const stigAssets = req.body
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant && collectionGrant.accessLevel >= 3 ) {
      const collectionResponse = await Collection.getCollection(collectionId, ['grants'], false, req.userObject )
      if (collectionResponse.grants.filter( grant => grant.accessLevel === 1 && grant.user.userId === userId).length > 0) {
        const setResponse = await Collection.setStigAssetsByCollectionUser(collectionId, userId, stigAssets, req.userObject ) 
        const getResponse = await Collection.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
        res.json(getResponse)    
      }
      else {
        throw new SmError.NotFoundError('User not found in this Collection with accessLevel === 1.')
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

module.exports.updateCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.query.elevate
    const collectionId = req.params.collectionId
    const projection = req.query.projection
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Collection.replaceCollection(collectionId, body, projection, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }    
  }
  catch (err) {
    next(err)
  }
}

function getCollectionIdAndCheckPermission(request, minimumAccessLevel = Security.ACCESS_LEVEL.Manage, allowElevate = false) {
  let collectionId = request.params.collectionId
  const elevate = request.query.elevate
  const collectionGrant = request.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
  if (!( (allowElevate && elevate) || (collectionGrant && collectionGrant.accessLevel >= minimumAccessLevel) )) {
    throw new SmError.PrivilegeError()
  }
  return collectionId
}

module.exports.getCollectionMetadata = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let result = await Collection.getCollectionMetadata(collectionId, req.userObject)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchCollectionMetadata = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let metadata = req.body
    await Collection.patchCollectionMetadata(collectionId, metadata)
    let result = await Collection.getCollectionMetadata(collectionId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putCollectionMetadata = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let body = req.body
    await Collection.putCollectionMetadata( collectionId, body)
    let result = await Collection.getCollectionMetadata(collectionId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionMetadataKeys = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let result = await Collection.getCollectionMetadataKeys(collectionId, req.userObject)
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
    let collectionId = getCollectionIdAndCheckPermission(req)
    let key = req.params.key
    let result = await Collection.getCollectionMetadataValue(collectionId, key, req.userObject)
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
    let collectionId = getCollectionIdAndCheckPermission(req)
    let key = req.params.key
    let value = req.body
    let result = await Collection.putCollectionMetadataValue(collectionId, key, value)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteCollectionMetadataKey = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req)
    let key = req.params.key
    let result = await Collection.deleteCollectionMetadataKey(collectionId, key, req.userObject)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteReviewHistoryByCollection = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const retentionDate = req.query.retentionDate
    const assetId = req.query.assetId
    
    let result = await Collection.deleteReviewHistoryByCollection(collectionId, retentionDate, assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewHistoryByCollection = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Full)
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const assetId = req.query.assetId
    const ruleId = req.query.ruleId
    const status = req.query.status

    let result = await Collection.getReviewHistoryByCollection(collectionId, startDate, endDate, assetId, ruleId, status)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewHistoryStatsByCollection = async function (req, res, next) {
  try {
    let collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Full)
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    const assetId = req.query.assetId
    const ruleId = req.query.ruleId
    const status = req.query.status
    const projection = req.query.projection

    let result = await Collection.getReviewHistoryStatsByCollection(collectionId, startDate, endDate, assetId, ruleId, status, projection)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getCollectionLabels = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await Collection.getCollectionLabels( collectionId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.createCollectionLabel = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const labelId = await Collection.createCollectionLabel( collectionId, req.body )
    const response = await Collection.getCollectionLabelById( collectionId, labelId, req.userObject )
    res.status(201).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getCollectionLabelById = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await Collection.getCollectionLabelById( collectionId, req.params.labelId, req.userObject )
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
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const affectedRows = await Collection.patchCollectionLabelById( collectionId, req.params.labelId, req.body )
    if (affectedRows === 0) {
      throw new SmError.NotFoundError()
    }
    const response = await Collection.getCollectionLabelById( collectionId, req.params.labelId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteCollectionLabelById = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Manage)
    const affectedRows = await Collection.deleteCollectionLabelById(collectionId, req.params.labelId)
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
    const collectionId = getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const response = await Collection.getAssetsByCollectionLabelId( collectionId, req.params.labelId, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.putAssetsByCollectionLabelId = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req)
    const labelId = req.params.labelId
    const assetIds = req.body
    let collection = await Collection.getCollection( collectionId, ['assets'], false, req.userObject)
    let collectionAssets = collection.assets.map( a => a.assetId)
    if (assetIds.every( a => collectionAssets.includes(a))) {
      await Collection.putAssetsByCollectionLabelId( collectionId, labelId, assetIds )
      const response = await Collection.getAssetsByCollectionLabelId( collectionId, req.params.labelId, req.userObject )
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
    const collectionId = getCollectionIdAndCheckPermission(req)
    const mode = req.query.mode
    const assetStigSelections = req.body
    
    // process body array into service arguments
    const assetStigArguments = await assetStigsToArgs (assetStigSelections, mode, req.userObject)

    const j2x = new J2X({
      attributeNamePrefix : "@_",
      attrNodeName: "@", //default is false
      textNodeName : "#text",
      ignoreAttributes : true,
      cdataTagName: "__cdata", //default is false
      cdataPositionChar: "\\c",
      format: true,
      indentBy: "  ",
      supressEmptyNode: false,
      tagValueProcessor: a => {
        return a ? he.encode(a.toString(), { useNamedReferences: false}) : a 
      },
      attrValueProcessor: a=> he.encode(a, {isAttributeValue: isAttribute, useNamedReferences: true})
    })

    const zip = Archiver('zip', {level: 9})
    // const zip = Archiver('tar', {gzip: true, gzipOptions:{level: 9}})
    res.attachment('ckl.zip')
    zip.pipe(res)
    for (const args of assetStigArguments) {
      const response = await AssetSvc.cklFromAssetStigs(args.assetId, args.benchmarkIds)
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n<!-- Classification: ${config.settings.setClassification} -->\n`
      xml += j2x.parse(response.cklJs)
      const filename = mode === 'mono' ? `${args.assetName}-${args.benchmarkIds[0]}-${response.revisionStrResolved}.ckl` : `${args.assetName}.ckl`
      zip.append(xml, {name: filename})
    }
    zip.finalize()
  }
  catch (err) {
    next(err)
  }
}

module.exports.postXccdfArchiveByCollection = async function (req, res, next) {
  try {
    const collectionId = getCollectionIdAndCheckPermission(req)
    const assetStigSelections = req.body
    
    // process body array into service arguments
    const assetStigArguments = await assetStigsToArgs (assetStigSelections, 'mono', req.userObject)

    const j2x = new J2X({
      attributeNamePrefix : "@_",
      textNodeName : "#text",
      ignoreAttributes : false,
      cdataTagName: "__cdata",
      cdataPositionChar: "\\c",
      format: true,
      indentBy: "  ",
      supressEmptyNode: true,
      tagValueProcessor: a => {
        return a ? he.encode(a.toString(), { useNamedReferences: false}) : a 
      },
      attrValueProcessor: a => he.encode(a, {isAttributeValue: true, useNamedReferences: true})
    })

    const zip = Archiver('zip', {level: 9})
    res.attachment('xccdf.zip')
    zip.pipe(res)
    for (const args of assetStigArguments) {
      const response = await AssetSvc.xccdfFromAssetStig(args.assetId, args.benchmarkIds[0])
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <!-- STIG Manager ${config.version} -->
      <!-- Classification: ${config.settings.setClassification} -->\n`
      xml += j2x.parse(response.xccdfJs)
      const filename = `${args.assetName}-${args.benchmarkIds[0]}-${response.revisionStrResolved}-xccdf.xml`
      zip.append(xml, {name: filename})
    }
    zip.finalize()
  }
  catch (err) {
    next(err)
  }
}

// for the archive streaming endpoints
async function assetStigsToArgs (assetStigSelections, mode = 'mono', userObject) {
  const assetStigArguments = []
  for (const assetStigSel of assetStigSelections) {
    const assetId = assetStigSel.assetId
    // MUST VERIFY assetId IS IN collectionId!
    let requestedBenchmarkIds = assetStigSel.benchmarkIds
      // If this user has no grants permitting access to the asset, the response will be undefined
    const assetResponse = await AssetSvc.getAsset(assetId, ['stigs'], false, userObject )
    if (!assetResponse) {
      throw new SmError.PrivilegeError()
    }
    const assetName = assetResponse.name

    // if (assetResponse.collection.collectionId !== collectionId) {
    //   continue // hmm... really?
    // }
    const availableBenchmarkIds = assetResponse.stigs.map( r => r.benchmarkId )
    if (availableBenchmarkIds.length === 0) {
      continue // hmm... really?
    }
    if (!requestedBenchmarkIds) {
      requestedBenchmarkIds = availableBenchmarkIds
    }
    else if (!requestedBenchmarkIds.every( requestedBenchmarkId => availableBenchmarkIds.includes(requestedBenchmarkId))) {
      throw new SmError.ClientError('Asset is not mapped to all requested benchmarkIds')
    }
    if (mode === 'mono') {
      for (const benchmarkId of requestedBenchmarkIds) {
        assetStigArguments.push({
          assetId,
          assetName,
          benchmarkIds: [benchmarkId]
        })
      }
    }
    else {
      assetStigArguments.push({
        assetId,
        assetName,
        benchmarkIds: requestedBenchmarkIds
      })
    }
  }
  return assetStigArguments
}
