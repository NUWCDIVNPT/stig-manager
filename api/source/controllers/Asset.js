'use strict';

const writer = require('../utils/writer')
const config = require('../utils/config')
const escape = require('../utils/escape')
const AssetService = require(`../service/AssetService`)
const CollectionService = require(`../service/CollectionService`)
const Collection = require('./Collection')
const Security = require('../utils/roles')
const dbUtils = require(`../service/utils`)
const {XMLBuilder} = require("fast-xml-parser")
const SmError = require('../utils/error')
const {escapeForXml} = require('../utils/escape')


module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    let projections = req.query.projection
    let assets = req.body
    const collectionId = req.body.collectionId

    const grant = req.userObject.grants[collectionId]
    if (!grant || grant.roleId < 3) throw new SmError.PrivilegeError()

    assets.noncomputing = assets.hasOwnProperty("noncomputing") ? (assets.noncomputing ? 1 : 0) : 0
    assets = [assets]

    const failures = await dbUtils.validateItems({assets, collectionId})

    if (failures.length > 0) {
      throw new  SmError.UnprocessableError(failures)
    }

    let assetId
    assetId = await AssetService.createAssets({assets, collectionId, svcStatus: res.svcStatus})
    
    const response = await AssetService.getAsset({
      assetId,
      projections,
      grant,
    })
    res.status(201).json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.createAssets = async function createAssets (req, res, next) {
  try {

    let projections = req.query.projection
    const collectionId  = req.params.collectionId
    let assets = req.body

    const grant = req.userObject.grants[collectionId]
    if (!grant || grant.roleId < 3) throw new SmError.PrivilegeError()

    // if batch normalize assets (put collection Id into the asset object) and make non-computing a 'boolean int'
    assets = assets.map(asset => ({
      ...asset,
      collectionId,
      noncomputing: asset.hasOwnProperty("noncomputing") ? (asset.noncomputing ? 1 : 0) : 0
    }))

    const failures = await dbUtils.validateItems({assets, collectionId})

    if (failures.length > 0) {
      throw new  SmError.UnprocessableError(failures)
    }

    let assetIds
    assetIds = await AssetService.createAssets( {assets, collectionId, svcStatus: res.svcStatus})
    
    const response = await AssetService.getAssets({
      filter: {
        collectionId: collectionId,
        assetIds,
      },
      projections,
      grant,
    })
    res.status(201).json(response)
  }
  catch (err) {
    next(err)
  }

}

module.exports.deleteAsset = async function deleteAsset (req, res, next) {
  try {
    let projections = req.query.projection
    const { assetId, grant } = await getAssetInfoAndVerifyAccess(req)
    const response = await AssetService.getAsset({assetId, projections, grant})
    await AssetService.deleteAsset(assetId, req.userObject.userId, res.svcStatus)
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.removeStigFromAsset = async function (req, res, next) {
  try {
    let benchmarkId = req.params.benchmarkId
    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req)
    await AssetService.removeStigFromAsset({assetId, benchmarkId, grant, svcStatus: res.svcStatus})
    const response = await AssetService.getStigsByAsset({assetId, grant})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.removeStigsFromAsset = async function removeStigsFromAsset (req, res, next) {
  try {
    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req)
    await AssetService.removeStigsFromAsset(assetId, grant, res.svcStatus)
    const response = await AssetService.getStigsByAsset({assetId, grant})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportAssets = async function exportAssets (projections, elevate, userObject) {
  // let assets =  await AssetService.getAssets({projections})
  // return assets
} 

module.exports.getAsset = async function (req, res, next) {
  try {
    const assetId = req.params.assetId
    const projections = req.query.projection

    const grant = await dbUtils.getGrantByAssetId(assetId, req.userObject.grants)
    if (!grant) throw new SmError.PrivilegeError()

    const response = await AssetService.getAsset({assetId, projections, grant})
    if (!response) throw new SmError.PrivilegeError()
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssets = async function (req, res, next) {
  try {
    const collectionId = req.query.collectionId
    const name = req.query.name
    const nameMatch = req.query['name-match']
    const benchmarkId = req.query.benchmarkId
    const metadata = req.query.metadata
    const labelIds = req.query.labelId
    const labelNames = req.query.labelName
    const labelMatch = req.query.labelMatch
    const projections = req.query.projection
    const grant = req.userObject.grants[collectionId]

    if (!grant) throw new SmError.PrivilegeError('No Grant in Collection')
    
    const response = await AssetService.getAssets({
      filter: {
        collectionId,
        labels: {labelIds, labelNames, labelMatch}, 
        name,
        nameMatch,
        benchmarkId,
        metadata
      },
      projections,
      grant
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getStigsByAsset = async function (req, res, next) {
  try {
    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Restricted)
    const response = await AssetService.getStigsByAsset({assetId, grant} )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getChecklistByAssetStig = async function getChecklistByAssetStig (req, res, next) {
  try {
    const assetId = req.params.assetId
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const format = req.query.format || 'json'

    const access = await dbUtils.getUserAssetStigAccess({assetId, benchmarkId, grants: req.userObject.grants})
    if (access === 'none') throw new SmError.PrivilegeError()

    const checklist = await AssetService.getChecklistByAssetStig(assetId, benchmarkId, revisionStr, format, req.userObject )
    if (format.startsWith('json')) {
      res.json(format === 'json-access' ? {access, checklist} : checklist)
      return
    }
    
    const dateString = escape.filenameComponentFromDate()
    const fileBasename = `${checklist.assetName}-${benchmarkId}-${checklist.revisionStrResolved}`
    if (format === 'cklb') {
      checklist.cklb.title = fileBasename
      writer.writeInlineFile(res, JSON.stringify(checklist.cklb), `${fileBasename}_${dateString}.cklb`, 'application/json')  // revisionStrResolved provides specific rev string, if "latest" was asked for.
    }
    else if (format === 'ckl') {
      const builder = new XMLBuilder({
        attributeNamePrefix : "@_",
        textNodeName : "#text",
        ignoreAttributes : true,
        format: true,
        indentBy: "  ",
        supressEmptyNode: false,
        processEntities: false,
        tagValueProcessor: escapeForXml,
        attrValueProcessor: escapeForXml
      })
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n<!-- Classification: ${config.settings.setClassification} -->\n`
      xml += builder.build(checklist.xmlJs)
      writer.writeInlineFile(res, xml, `${fileBasename}_${dateString}.ckl`, 'application/xml')  // revisionStrResolved provides specific rev string, if "latest" was asked for.
    }
    else if (format === 'xccdf') {
      const builder = new XMLBuilder({
        attributeNamePrefix : "@_",
        textNodeName : "#text",
        ignoreAttributes : false,
        cdataTagName: "__cdata",
        cdataPositionChar: "\\c",
        format: true,
        indentBy: "  ",
        supressEmptyNode: true,
        processEntities: false,
        tagValueProcessor: escapeForXml,
        attrValueProcessor: escapeForXml
      })
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n<!-- Classification: ${config.settings.setClassification} -->\n`
      xml += builder.build(checklist.xmlJs)
      writer.writeInlineFile(res, xml, `${fileBasename}-xccdf_${dateString}.xml`, 'application/xml')  // revisionStrResolved provides specific rev string, if "latest" was asked for.
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getChecklistByAsset = async function (req, res, next) {
  try {
    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Restricted)

    const format = req.query.format //default of .ckl provided by EOV

    const assetResponse = await AssetService.getAsset({assetId, projections: ['stigs'], grant} )
    const availableBenchmarkIds = assetResponse.stigs.map( r => r.benchmarkId )
    if (availableBenchmarkIds.length === 0) {
      res.status(204).end()
      return
    }
    const requestedBenchmarkIds = req.query.benchmarkId ?? availableBenchmarkIds
    if (!requestedBenchmarkIds.every( requestedBenchmarkId => availableBenchmarkIds.includes(requestedBenchmarkId))) {
      throw new SmError.ClientError('Asset is not mapped to all requested benchmarkIds')
    }

    const stigs = requestedBenchmarkIds.map( benchmarkId => ({benchmarkId, revisionStr: 'latest'}) )

    const response = await AssetService.getChecklistByAsset(assetId, stigs, format)

    const dateString = escape.filenameComponentFromDate()
    if (format === 'cklb') {
      writer.writeInlineFile(res, JSON.stringify(response.cklb), `${response.assetName}_${dateString}.cklb`, 'application/json') 
    }
    else if (format === 'ckl') {
      const builder = new XMLBuilder({
        attributeNamePrefix : "@_",
        textNodeName : "#text",
        ignoreAttributes : true,
        format: true,
        indentBy: "  ",
        supressEmptyNode: false,
        processEntities: false,
        tagValueProcessor: escapeForXml,
        attrValueProcessor: escapeForXml
      })
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n`
      xml += builder.build(response.xmlJs)
      writer.writeInlineFile(res, xml, `${response.assetName}_${dateString}.ckl`, 'application/xml')
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssetsByStig = async function getAssetsByStig (req, res, next) {
  try {
    const benchmarkId = req.params.benchmarkId
    const labelIds = req.query.labelId
    const labelNames = req.query.labelName
    const labelMatch = req.query.labelMatch
    const projections = req.query.projection

    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const response = await AssetService.getAssetsByStig({
      collectionId, 
      benchmarkId, 
      labels: {labelIds, labelNames, labelMatch},
      projections, 
      grant
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceAsset = async function replaceAsset (req, res, next) {
  try {
    const projections = req.query.projection
    const body = req.body

    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req)

    const currentAsset = await AssetService.getAsset({assetId, projections, grant})
    // Check if the asset is being transferred
    const transferring = body.collectionId && currentAsset.collection.collectionId !== body.collectionId ? 
      {oldCollectionId: currentAsset.collection.collectionId, newCollectionId: body.collectionId} : null
    if (transferring) {
      // If so, Check if the user has an appropriate grant to the asset's updated collection
      const updatedCollectionGrant = req.userObject.grants[body.collectionId]
      if ( !updatedCollectionGrant || updatedCollectionGrant.roleId < 3 ) {
        throw new SmError.PrivilegeError(`insufficient privilege in destination collection to transfer this asset.`)
      }
    }
    await AssetService.updateAsset({
      assetId,
      body,
      transferring,
      svcStatus: res.svcStatus
    })
    const asset = await AssetService.getAsset({assetId, projections, grant})
    res.json(asset)
  }
  catch (err) {
    next(err)
  }
}

module.exports.attachAssetsToStig = async function attachAssetsToStig (req, res, next) {
  try {
    let benchmarkId = req.params.benchmarkId
    let assetIds = req.body
    let projections = req.query.projection

    const { collectionId, grant } = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Manage)
    let collection = await CollectionService.getCollection( collectionId, ['assets'], false, req.userObject)
    let collectionAssets = collection.assets.map( a => a.assetId)
    if (assetIds.every( a => collectionAssets.includes(a))) {
      await AssetService.attachAssetsToStig( collectionId, benchmarkId, assetIds )
      let response = await AssetService.getAssetsByStig({collectionId, benchmarkId, projections, grant})
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

module.exports.attachStigToAsset = async function attachStigToAsset (req, res, next) {
  try {

    let benchmarkId = req.params.benchmarkId
    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Manage)
    await AssetService.attachStigToAsset({
      assetId,
      benchmarkId,
      grant,
      svcStatus: res.svcStatus
    })
    const response = await AssetService.getStigsByAsset({assetId, grant})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.updateAsset = async function updateAsset (req, res, next) {
  try {
    const projections = req.query.projection
    const body = req.body

    const {assetId, grant} = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Manage)

    // If this user has no grants permitting access to the asset, the response will be undefined
    const currentAsset = await AssetService.getAsset({assetId, projections, grant} )
    // if (!currentAsset) {
    //   throw new SmError.PrivilegeError('User has insufficient privilege to modify this asset.')
    // }
    // // Check if the user has an appropriate grant to the asset's collection
    // const currentCollectionGrant = req.userObject.grants[currentAsset.collection.collectionId]
    // if ( !currentCollectionGrant || currentCollectionGrant.roleId < 3 ) {
    //   throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${currentAsset.collection.collectionId} to modify this asset.`)
    // }
    // Check if the asset's collectionId is being changed
    const transferring = body.collectionId && currentAsset.collection.collectionId !== body.collectionId ? 
      {oldCollectionId: currentAsset.collection.collectionId, newCollectionId: body.collectionId} : null
    if (transferring) {
      // If so, Check if the user has an appropriate grant to the asset's updated collection
      const updatedCollectionGrant = req.userObject.grants[body.collectionId]
      if ( !updatedCollectionGrant || updatedCollectionGrant.roleId < 3 ) {
        throw new SmError.PrivilegeError(`User has insufficient privilege in destination collection to transfer this asset.`)
      }
    }
    await AssetService.updateAsset({
      assetId,
      body,
      projections,
      transferring,
      currentCollectionId: currentAsset.collection.collectionId,
      userObject: req.userObject,
      svcStatus: res.svcStatus
    })
    const response = await AssetService.getAsset({assetId, projections, grant})
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssetMetadata = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Restricted)
    let result = await AssetService.getAssetMetadata(assetId, req.userObject)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchAssetMetadata = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req)
    let metadata = req.body
    await AssetService.patchAssetMetadata(assetId, metadata)
    let result = await AssetService.getAssetMetadata(assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putAssetMetadata = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req)
    let body = req.body
    await AssetService.putAssetMetadata(assetId, body)
    let result = await AssetService.getAssetMetadata(assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getAssetMetadataKeys = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Restricted)
    let result = await AssetService.getAssetMetadataKeys(assetId, req.userObject)
    if (!result) {
      throw new SmError.NotFoundError('metadata keys not found')
    }
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getAssetMetadataValue = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req, Security.ROLES.Restricted)
    let key = req.params.key
    let result = await AssetService.getAssetMetadataValue(assetId, key, req.userObject)
    if (!result) { 
      throw new SmError.NotFoundError('metadata key not found')
    }
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putAssetMetadataValue = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req)
    let key = req.params.key
    let value = req.body

    await AssetService.putAssetMetadataValue(assetId, key, value)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}


module.exports.deleteAssetMetadataKey = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req)
    let key = req.params.key

    await AssetService.deleteAssetMetadataKey(assetId, key, req.userObject)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchAssets = async function (req, res, next) {
  try {
    // feature supports delete only
    const collectionId = getCollectionIdAndVerifyAccess(req, Security.ROLES.Manage)
    const patchRequest = req.body

    // optimization: replace below with targeted sql query, select from asset where assetId in ? and collectionId != ?
    const collection = await CollectionService.getCollection( collectionId, ['assets'], false, req.userObject)
    const collectionAssets = collection.assets.map( a => a.assetId)
    if (!patchRequest.assetIds.every( a => collectionAssets.includes(a))) {
      throw new SmError.PrivilegeError('One or more assetId is not a Collection member.')
    }
    await AssetService.deleteAssets(patchRequest.assetIds, req.userObject.userId, res.svcStatus)
    res.json({
      operation: 'deleted',
      assetIds: patchRequest.assetIds
    })
  }
  catch (err) {
    next(err)
  }
}

function getCollectionIdAndVerifyAccess(request, minimumRole = Security.ROLES.Manage) {
  let collectionId = request.query.collectionId
  const grant = request.userObject.grants[collectionId]
  if (grant?.roleId < minimumRole || !grant) {
    throw new SmError.PrivilegeError()
  }
  return collectionId
}

/**
 * Retrieves asset information and verifies user access to the asset which the operation is effecting.
 * Also, ensures that the user has sufficient access level to perform the operation.
 * @param {Object} request - The request object.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the assetId and a grant.
 * @throws {SmError.PrivilegeError} - user does not have sufficient access level or the asset does not exist.
 */
async function getAssetInfoAndVerifyAccess(request, roleId = Security.ROLES.Manage) {
  const assetId = request.params.assetId
  const [rows] = await dbUtils.selectCollectionByAssetId(assetId)
  const grant = request.userObject.grants[rows[0]?.collectionId]
  // check if user has sufficient access level
  if (!grant || grant.roleId < roleId) {
    throw new SmError.PrivilegeError("Insufficient access to this asset's collection.")
  }
  return {assetId, grant}
}
