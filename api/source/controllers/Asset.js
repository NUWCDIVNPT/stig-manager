'use strict';

const writer = require('../utils/writer')
const config = require('../utils/config')
const escape = require('../utils/escape')
const AssetService = require(`../service/AssetService`)
const CollectionService = require(`../service/CollectionService`)
const Collection = require('./Collection')
const Security = require('../utils/accessLevels')
const dbUtils = require(`../service/utils`)
const {XMLBuilder} = require("fast-xml-parser")
const SmError = require('../utils/error')
const {escapeForXml} = require('../utils/escape')


module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    const elevate = req.query.elevate
    let projection = req.query.projection
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )

    if ( elevate || (collectionGrant?.accessLevel >= 3) ) {
      try {
        let asset = await AssetService.createAsset( {body, projection, elevate, userObject: req.userObject, svcStatus: res.svcStatus})
        res.status(201).json(asset)
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
      // Not elevated or having collectionGrant
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteAsset = async function deleteAsset (req, res, next) {
  try {
    let elevate = req.query.elevate
    let projection = req.query.projection
    const { assetId } = await getAssetInfoAndVerifyAccess(req)
    const response = await AssetService.getAsset(assetId, projection, elevate, req.userObject)
    await AssetService.deleteAsset( assetId, projection, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.removeStigFromAsset = async function removeStigFromAsset (req, res, next) {
  try {
    let benchmarkId = req.params.benchmarkId
    let elevate = req.query.elevate
    const { assetId } = await getAssetInfoAndVerifyAccess(req)
    let response = await AssetService.removeStigFromAsset(assetId, benchmarkId, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.removeStigsFromAsset = async function removeStigsFromAsset (req, res, next) {
  try {
    let elevate = req.query.elevate
    const { assetId } = await getAssetInfoAndVerifyAccess(req)
    let response = await AssetService.removeStigsFromAsset(assetId, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

// module.exports.removeUserFromAssetStig = async function removeUserFromAssetStig (req, res, next) {
//   try {
//     let assetId = req.params.assetId
//     let benchmarkId = req.params.benchmarkId
//     let userId = req.params.userId
//     let elevate = req.query.elevate

//     // fetch the Asset for access control checks
//     let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
//     // can the user fetch this Asset?
//     if (!assetToAffect) {
//       throw new SmError.PrivilegeError()
//     }
//     const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
//     // is the granted accessLevel high enough?
//     if ( elevate || (collectionGrant?.accessLevel >= 3) ) {
//       let response = await Asset.removeUserFromAssetStig(assetId, benchmarkId, userId, elevate, req.userObject )
//       res.json(response)
//       }
//     else {
//       throw new SmError.PrivilegeError()
//     }
//   }
//   catch (err) {
//     next(err)
//   }
// }

module.exports.removeUsersFromAssetStig = async function removeUsersFromAssetStig (req, res, next) {
  try {
    let benchmarkId = req.params.benchmarkId
    let elevate = req.query.elevate
    const { assetId } = await getAssetInfoAndVerifyAccess(req)
    let response = await AssetService.removeUsersFromAssetStig(assetId, benchmarkId, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.exportAssets = async function exportAssets (projection, elevate, userObject) {
  let assets =  await AssetService.getAssets(null, null, null, null, null, null, projection, elevate, userObject )
  return assets
} 

module.exports.getAsset = async function getAsset (req, res, next) {
  try {
    let assetId = req.params.assetId
    let projection = req.query.projection
    let elevate = req.query.elevate
    
    // If this user has no grants permitting access to the asset, the response will be undefined
    let response = await AssetService.getAsset(assetId, projection, elevate, req.userObject )
    if (!response) {
      throw new SmError.PrivilegeError()
    }

    // If there is a response and the request included the stigGrants projection
    if (projection?.includes('stigGrants')) {
      // Check if the stigGrants projection is forbidden
      if (!elevate) {
        const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === response.collection.collectionId )
        if (collectionGrant?.accessLevel < 3) {
          throw new SmError.PrivilegeError(`User has insufficient privilege to request projection 'stigGrants'.`)
        }
      }
    }
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssets = async function getAssets (req, res, next) {
  try {
    let collectionId = req.query.collectionId
    let name = req.query.name
    let nameMatch = req.query['name-match']
    let benchmarkId = req.query.benchmarkId
    let metadata = req.query.metadata
    let labelIds = req.query.labelId
    let labelNames = req.query.labelName
    let labelMatch = req.query.labelMatch
    let projection = req.query.projection
    let elevate = req.query.elevate
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )

    if ( collectionGrant || elevate ) {
  
      // If there is a response and the request included the stigGrants projection
      if (projection?.includes('stigGrants')) {
        // Check if the stigGrants projection is forbidden
        if (!elevate) {
          if (collectionGrant?.accessLevel < 3)  {
            throw new SmError.PrivilegeError()
          }
        }
      }
      let response = await AssetService.getAssets(collectionId, {labelIds, labelNames, labelMatch}, name, nameMatch, benchmarkId, metadata, projection, elevate, req.userObject )
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

module.exports.getStigsByAsset = async function getStigsByAsset (req, res, next) {
  try {
    let assetId = req.params.assetId
    let elevate = req.query.elevate
    let response = await AssetService.getStigsByAsset(assetId, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

// module.exports.getUsersByAssetStig = async function getUsersByAssetStig (req, res, next) {
//   try {
//     let assetId = req.params.assetId
//     let benchmarkId = req.params.benchmarkId
//     let elevate = req.query.elevate
//     let response = await Asset.getUsersByAssetStig(assetId, benchmarkId, elevate, req.userObject )
//     res.json(response)
//   }
//   catch (err) {
//     next(err)
//   }
// }

module.exports.getChecklistByAssetStig = async function getChecklistByAssetStig (req, res, next) {
  try {
    const assetId = req.params.assetId
    const benchmarkId = req.params.benchmarkId
    const revisionStr = req.params.revisionStr
    const format = req.query.format || 'json'
    if (await dbUtils.userHasAssetStigs(assetId, [benchmarkId], false, req.userObject)) {
      const response = await AssetService.getChecklistByAssetStig(assetId, benchmarkId, revisionStr, format, false, req.userObject )
      if (format === 'json') {
        res.json(response)
        return
      }
      
      const dateString = escape.filenameComponentFromDate()
      const fileBasename = `${response.assetName}-${benchmarkId}-${response.revisionStrResolved}`
      if (format === 'cklb') {
        response.cklb.title = fileBasename
        writer.writeInlineFile(res, JSON.stringify(response.cklb), `${fileBasename}_${dateString}.cklb`, 'application/json')  // revisionStrResolved provides specific rev string, if "latest" was asked for.
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
        xml += builder.build(response.xmlJs)
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
        xml += builder.build(response.xmlJs)
        writer.writeInlineFile(res, xml, `${fileBasename}-xccdf_${dateString}.xml`, 'application/xml')  // revisionStrResolved provides specific rev string, if "latest" was asked for.
      }
    }
    else {
      res.status(204).end()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getChecklistByAsset = async function getChecklistByAssetStig (req, res, next) {
  try {
    const assetId = req.params.assetId
    let requestedBenchmarkIds = req.query.benchmarkId
    const format = req.query.format //default of .ckl provided by EOV

    // If this user has no grants permitting access to the asset, the response will be undefined
    const assetResponse = await AssetService.getAsset(assetId, ['stigs'], false, req.userObject )
    if (!assetResponse) {
      throw new SmError.PrivilegeError()
    }
    const availableBenchmarkIds = assetResponse.stigs.map( r => r.benchmarkId )
    if (availableBenchmarkIds.length === 0) {
      res.status(204).end()
      return
    }
    if (!requestedBenchmarkIds) {
      requestedBenchmarkIds = availableBenchmarkIds
    }
    else if (!requestedBenchmarkIds.every( requestedBenchmarkId => availableBenchmarkIds.includes(requestedBenchmarkId))) {
      throw new SmError.ClientError('Asset is not mapped to all requested benchmarkIds')
    }

    const stigs = requestedBenchmarkIds.map( benchmarkId => ({benchmarkId, revisionStr: 'latest'}) )

    const response = await AssetService.getChecklistByAsset(assetId, stigs, format, false, req.userObject )

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
    let benchmarkId = req.params.benchmarkId
    let labelIds = req.query.labelId
    let labelNames = req.query.labelName
    let labelMatch = req.query.labelMatch
    let projection = req.query.projection

    let { collectionId } = Collection.getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    let response = await AssetService.getAssetsByStig( collectionId, benchmarkId, {labelIds, labelNames, labelMatch}, projection, false, req.userObject )
    res.json(response)
    
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceAsset = async function replaceAsset (req, res, next) {
  try {
    const elevate = req.query.elevate
    const assetId = req.params.assetId
    const projection = req.query.projection
    const body = req.body

    // If this user has no grants permitting access to the asset, the response will be undefined
    const currentAsset = await AssetService.getAsset(assetId, projection, elevate, req.userObject )
    if (!currentAsset) {
      throw new SmError.PrivilegeError('User has insufficient privilege to modify this asset.')
    }
    // Check if the user has an appropriate grant to the asset's collection
    const currentCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === currentAsset.collection.collectionId )
    if ( !currentCollectionGrant || currentCollectionGrant.accessLevel < 3 ) {
      throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${currentAsset.collection.collectionId} to modify this asset.`)
    }
    // Check if the asset is being transferred
    const transferring = body.collectionId && currentAsset.collection.collectionId !== body.collectionId ? 
      {oldCollectionId: currentAsset.collection.collectionId, newCollectionId: body.collectionId} : null
    if (transferring) {
      // If so, Check if the user has an appropriate grant to the asset's updated collection
      const updatedCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )
      if ( !updatedCollectionGrant || updatedCollectionGrant.accessLevel < 3 ) {
        throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${body.collectionId} to transfer this asset.`)
      }
    }
    const response = await AssetService.updateAsset({
      assetId,
      body,
      projection,
      transferring,
      userObject: req.userObject,
      svcStatus: res.svcStatus
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.attachAssetsToStig = async function attachAssetsToStig (req, res, next) {
  try {
    let elevate = req.query.elevate
    let benchmarkId = req.params.benchmarkId
    let assetIds = req.body
    let projection = req.query.projection

    const { collectionId } = Collection.getCollectionInfoAndCheckPermission(req, Security.ACCESS_LEVEL.Manage, true)
    let collection = await CollectionService.getCollection( collectionId, ['assets'], elevate, req.userObject)
    let collectionAssets = collection.assets.map( a => a.assetId)
    if (assetIds.every( a => collectionAssets.includes(a))) {
      await AssetService.attachAssetsToStig( collectionId, benchmarkId, assetIds, projection, elevate, req.userObject )
      let response = await AssetService.getAssetsByStig( collectionId, benchmarkId, null, projection, elevate, req.userObject )
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
    let elevate = req.query.elevate
    const { assetId, collectionGrant } = await getAssetInfoAndVerifyAccess(req)
    if (elevate || collectionGrant.accessLevel >= 3) {
      let response = await AssetService.attachStigToAsset({
        assetId,
        benchmarkId,
        collectionId: collectionGrant.collection.collectionId,
        elevate,
        userObject: req.userObject,
        svcStatus: res.svcStatus
      })      
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

module.exports.attachStigsToAsset = async function attachStigsToAsset (req, res, next) {
  try {
    let elevate = req.query.elevate
    let body = req.body
    const { assetId } = await getAssetInfoAndVerifyAccess(req)
    if (elevate) {
      let response = await AssetService.attachStigsToAsset(assetId, body, elevate, req.userObject )
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

module.exports.setAssetStigGrant = async function setAssetStigGrant (req, res, next) {
  try {
    let benchmarkId = req.params.benchmarkId
    let userId = req.query.params.userId
    let elevate = req.query.elevate
    const { assetId } = await getAssetInfoAndVerifyAccess(req)

    const collectionObj = await CollectionService.getCollection(assetToAffect.collection.collectionId, ['grants'], elevate, req.userObject)
    // Filter out users with incompatible grants (accessLevels != 1)
    const collectionUsers = collectionObj.grants.filter(g => g.accessLevel === 1)
    const collectionUserIds = collectionUsers.map(g => g.user.userId)
    // Check the requested userId
    const allowed = collectionUserIds.includes(userId)
    if (! allowed) {
      // Can only map Users with an existing grant
      throw new SmError.ClientError(`The user has an incompatible or missing grant in collectionId ${body.collectionId}.`)
    }
    let response = await AssetService.setAssetStigGrant(assetId, benchmarkId, userId, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.setAssetStigGrants = async function setAssetStigGrants (req, res, next) {
  try {
    let benchmarkId = req.params.benchmarkId
    let body = req.body
    let elevate = req.query.elevate
    const { assetId } = await getAssetInfoAndVerifyAccess(req)
    const collectionObj = await CollectionService.getCollection(assetToAffect.collection.collectionId, ['grants'], elevate, req.userObject)
    let userIdsFromRequest = body
    if (userIdsFromRequest.length > 0) {
      // Filter out users with incompatible grants (accessLevels != 1)
      const collectionUsers = collectionObj.grants.filter(g => g.accessLevel === 1)
      const collectionUserIds = collectionUsers.map(g => g.user.userId)
      // Check every requested userId
      const allowed = userIdsFromRequest.every(i => collectionUserIds.includes(i))
      if (! allowed) {
        // Can only map Users with an existing grant
        throw new SmError.ClientError(`One or more users have incompatible or missing grants in collectionId ${body.collectionId}.`)
      }
    }
    let response = await AssetService.setAssetStigGrants(assetId, benchmarkId, body, elevate, req.userObject )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.updateAsset = async function updateAsset (req, res, next) {
  try {
    const elevate = req.query.elevate
    const assetId = req.params.assetId
    const projection = req.query.projection
    const body = req.body

    // If this user has no grants permitting access to the asset, the response will be undefined
    const currentAsset = await AssetService.getAsset(assetId, projection, elevate, req.userObject )
    if (!currentAsset) {
      throw new SmError.PrivilegeError('User has insufficient privilege to modify this asset.')
    }
    // Check if the user has an appropriate grant to the asset's collection
    const currentCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === currentAsset.collection.collectionId )
    if ( !currentCollectionGrant || currentCollectionGrant.accessLevel < 3 ) {
      throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${currentAsset.collection.collectionId} to modify this asset.`)
    }
    // Check if the asset's collectionId is being changed
    const transferring = body.collectionId && currentAsset.collection.collectionId !== body.collectionId ? 
      {oldCollectionId: currentAsset.collection.collectionId, newCollectionId: body.collectionId} : null
    if (transferring) {
      // If so, Check if the user has an appropriate grant to the asset's updated collection
      const updatedCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )
      if ( !updatedCollectionGrant || updatedCollectionGrant.accessLevel < 3 ) {
        throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${body.collectionId} to transfer this asset.`)
      }
    }
    const response = await AssetService.updateAsset({
      assetId,
      body,
      projection,
      transferring,
      currentCollectionId: currentAsset.collection.collectionId,
      userObject: req.userObject,
      svcStatus: res.svcStatus
    })
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssetMetadata = async function (req, res, next) {
  try {
    let { assetId } = await getAssetInfoAndVerifyAccess(req, Security.ACCESS_LEVEL.Restricted)
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
    let { assetId } = await getAssetInfoAndVerifyAccess(req, Security.ACCESS_LEVEL.Restricted)
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
    let { assetId } = await getAssetInfoAndVerifyAccess(req, Security.ACCESS_LEVEL.Restricted)
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
    const collectionId = getCollectionIdAndVerifyAccess(req, Security.ACCESS_LEVEL.Manage)
    const patchRequest = req.body
    const collection = await CollectionService.getCollection( collectionId, ['assets'], false, req.userObject)
    const collectionAssets = collection.assets.map( a => a.assetId)
    if (!patchRequest.assetIds.every( a => collectionAssets.includes(a))) {
      throw new SmError.PrivilegeError('One or more assetId is not a Collection member.')
    }
    await AssetService.deleteAssets(patchRequest.assetIds, req.userObject)
    res.json({
      operation: 'deleted',
      assetIds: patchRequest.assetIds
    })
  }
  catch (err) {
    next(err)
  }
}

function getCollectionIdAndVerifyAccess(request, minimumAccessLevel = Security.ACCESS_LEVEL.Manage) {
  let collectionId = request.query.collectionId
  const collectionGrant = request.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
  if (collectionGrant?.accessLevel < minimumAccessLevel || !collectionGrant) {
    throw new SmError.PrivilegeError()
  }
  return collectionId
}

/**
 * Retrieves asset information and verifies user access to the asset which the operation is effecting.
 * Also, ensures that the user has sufficient access level to perform the operation.
 * @param {Object} request - The request object.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the assetId and a collectionGrant.
 * @throws {SmError.PrivilegeError} - user does not have sufficient access level or the asset does not exist.
 */
async function getAssetInfoAndVerifyAccess(request, accessLevel = Security.ACCESS_LEVEL.Manage) {
  let assetId = request.params.assetId

  // fetch the Asset for access control checks and the response
  let assetToAffect = await AssetService.getAsset(assetId, [], false, request.userObject)
  // can the user fetch this Asset?
  if (!assetToAffect) {
    throw new SmError.PrivilegeError()
  }
  const collectionGrant = request.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
  // check if user has sufficient access level
  if (collectionGrant?.accessLevel < accessLevel) {
    throw new SmError.PrivilegeError("Insufficient access level.")
  }
  return {assetId, collectionGrant}
}
