'use strict';

const writer = require('../utils/writer');
const config = require('../utils/config')
const Asset = require(`../service/${config.database.type}/AssetService`);
const Collection = require(`../service/${config.database.type}/CollectionService`);
const dbUtils = require(`../service/${config.database.type}/utils`)
const J2X = require("fast-xml-parser").j2xParser
const he = require('he')
const SmError = require('../utils/error')

module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    const elevate = req.query.elevate
    let projection = req.query.projection
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )

    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      try {
        let asset = await Asset.createAsset( body, projection, elevate, req.userObject)
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
    let assetId = req.params.assetId
    let projection = req.query.projection

    // fetch the Asset for access control checks and the response
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      await Asset.deleteAsset( assetId, projection, elevate, req.userObject )
      res.json(assetToAffect)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.removeStigFromAsset = async function removeStigFromAsset (req, res, next) {
  try {
    let assetId = req.params.assetId
    let benchmarkId = req.params.benchmarkId
    let elevate = req.query.elevate

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeStigFromAsset(assetId, benchmarkId, elevate, req.userObject )
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

module.exports.removeStigsFromAsset = async function removeStigsFromAsset (req, res, next) {
  try {
    let assetId = req.params.assetId
    let elevate = req.query.elevate

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, undefined, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeStigsFromAsset(assetId, elevate, req.userObject )
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
//     if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
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
    let assetId = req.params.assetId
    let benchmarkId = req.params.benchmarkId
    let elevate = req.query.elevate

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeUsersFromAssetStig(assetId, benchmarkId, elevate, req.userObject )
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

module.exports.exportAssets = async function exportAssets (projection, elevate, userObject) {
  let assets =  await Asset.getAssets(null, null, null, null, null, null, projection, elevate, userObject )
  return assets
} 

module.exports.getAsset = async function getAsset (req, res, next) {
  try {
    let assetId = req.params.assetId
    let projection = req.query.projection
    let elevate = req.query.elevate
    
    // If this user has no grants permitting access to the asset, the response will be undefined
    let response = await Asset.getAsset(assetId, projection, elevate, req.userObject )
    if (!response) {
      throw new SmError.PrivilegeError()
    }
    
    // If there is a response, check if the request included the stigGrants projection
    if (projection && projection.includes('stigGrants')) {
      // Check if the stigGrants projection is forbidden
      if (!elevate) {
        const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === response.collection.collectionId )
        if ((collectionGrant && collectionGrant.accessLevel < 3) || req.userObject.privileges.globalAccess ) {
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
    let projection = req.query.projection
    let elevate = req.query.elevate
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )

    if ( collectionGrant || req.userObject.privileges.globalAccess || elevate ) {
      // Check if the request includes the stigGrants projection
      if (projection && projection.includes('stigGrants')) {
        // Check if the stigGrants projection is forbidden
        if (!elevate) {
          if ((collectionGrant && collectionGrant.accessLevel < 3) || req.userObject.privileges.globalAccess ) {
            throw new SmError.PrivilegeError()
          }
        }
      }
      let response = await Asset.getAssets(collectionId, labelIds, name, nameMatch, benchmarkId, metadata, projection, elevate, req.userObject )
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
    let response = await Asset.getStigsByAsset(assetId, elevate, req.userObject )
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
    let assetId = req.params.assetId
    let benchmarkId = req.params.benchmarkId
    let revisionStr = req.params.revisionStr
    let format = req.query.format || 'json'
    if (await dbUtils.userHasAssetStigs(assetId, [benchmarkId], false, req.userObject)) {
      let response = await Asset.getChecklistByAssetStig(assetId, benchmarkId, revisionStr, format, false, req.userObject )
      if (format === 'json') {
        res.json(response)
      }
      else if (format === 'ckl') {
        let defaultOptions = {
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
        }
        const j2x = new J2X(defaultOptions)
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n<!-- Classification: ${config.settings.setClassification} -->\n`
        xml += j2x.parse(response.cklJs)
        writer.writeInlineFile(res, xml, `${response.assetName}-${benchmarkId}-${response.revisionStrResolved}.ckl`, 'application/xml')  // revisionStrResolved provides specific rev string filename, if "latest" was asked for.
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
    let assetId = req.params.assetId
    let requestedBenchmarkIds = req.query.benchmarkId

    // If this user has no grants permitting access to the asset, the response will be undefined
    let assetResponse = await Asset.getAsset(assetId, ['stigs'], false, req.userObject )
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

    let cklObject = await Asset.getChecklistByAsset(assetId, requestedBenchmarkIds, 'ckl', false, req.userObject )
    let parseOptions = {
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
    }
    const j2x = new J2X(parseOptions)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n`
    xml += j2x.parse(cklObject.cklJs)
    writer.writeInlineFile(res, xml, `${cklObject.assetName}.ckl`, 'application/xml')
  }
  catch (err) {
    next(err)
  }
}

module.exports.getAssetsByStig = async function getAssetsByStig (req, res, next) {
  try {
    let elevate = req.query.elevate
    let collectionId = req.params.collectionId
    let benchmarkId = req.params.benchmarkId
    let labelId = req.query.labelId
    let projection = req.query.projection

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || req.userObject.privileges.globalAccess || collectionGrant ) {
        let response = await Asset.getAssetsByStig( collectionId, benchmarkId, labelId, projection, elevate, req.userObject )
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

module.exports.replaceAsset = async function replaceAsset (req, res, next) {
  try {
    const elevate = req.query.elevate
    const assetId = req.params.assetId
    const projection = req.query.projection
    const body = req.body

    // If this user has no grants permitting access to the asset, the response will be undefined
    const currentAsset = await Asset.getAsset(assetId, projection, elevate, req.userObject )
    if (!currentAsset) {
      throw new SmError.PrivilegeError('User has insufficient privilege to modify this asset.')
    }
    // Check if the user has an appropriate grant to the asset's collection
    const currentCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === currentAsset.collection.collectionId )
    if ( !currentCollectionGrant || currentCollectionGrant.accessLevel < 3 ) {
      throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${currentAsset.collection.collectionId} to modify this asset.`)
    }
    // Check if the asset is being transferred
    const transferring = currentAsset.collection.collectionId !== body.collectionId
    if (transferring) {
      // If so, Check if the user has an appropriate grant to the asset's updated collection
      const updatedCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )
      if ( !updatedCollectionGrant || updatedCollectionGrant.accessLevel < 3 ) {
        throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${body.collectionId} to transfer this asset.`)
      }
    }
    const response = await Asset.updateAsset(
      assetId,
      body,
      projection,
      transferring,
      req.userObject
    )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}

module.exports.attachAssetsToStig = async function attachAssetsToStig (req, res, next) {
  try {
    let elevate = req.query.elevate
    let collectionId = req.params.collectionId
    let benchmarkId = req.params.benchmarkId
    let assetIds = req.body
    let projection = req.query.projection

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let collection = await Collection.getCollection( collectionId, ['assets'], elevate, req.userObject)
      let collectionAssets = collection.assets.map( a => a.assetId)
      if (assetIds.every( a => collectionAssets.includes(a))) {
        await Asset.attachAssetsToStig( collectionId, benchmarkId, assetIds, projection, elevate, req.userObject )
        let response = await Asset.getAssetsByStig( collectionId, benchmarkId, null, projection, elevate, req.userObject )
        res.json(response)
      }
      else {
        throw new SmError.PrivilegeError('One or more assetId is not a Collection member.')
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

module.exports.attachStigToAsset = async function attachStigToAsset (req, res, next) {
  try {
    let assetId = req.params.assetId
    let benchmarkId = req.params.benchmarkId
    let elevate = req.query.elevate

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.attachStigToAsset(assetId, benchmarkId, elevate, req.userObject )
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
    let assetId = req.params.assetId
    let elevate = req.query.elevate
    let body = req.body

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.attachStigsToAsset(assetId, body, elevate, req.userObject )
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
    let assetId = req.params.assetId
    let benchmarkId = req.params.benchmarkId
    let userId = req.query.params.userId
    let elevate = req.query.elevate

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const requesterCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the requester's granted accessLevel high enough?
    if ( elevate || (requesterCollectionGrant && requesterCollectionGrant.accessLevel >= 3) ) {
      // Verify the userId has accessLevel 1 on the Asset's Collection
      const collectionObj = await Collection.getCollection(assetToAffect.collection.collectionId, ['grants'], elevate, req.userObject)
      // Filter out users with incompatible grants (accessLevels != 1)
      const collectionUsers = collectionObj.grants.filter(g => g.accessLevel === 1)
      const collectionUserIds = collectionUsers.map(g => g.user.userId)
      // Check the requested userId
      const allowed = collectionUserIds.includes(userId)
      if (! allowed) {
        // Can only map Users with an existing grant
        throw new SmError.ClientError(`The user has an incompatible or missing grant in collectionId ${body.collectionId}.`)
      }
      let response = await Asset.setAssetStigGrant(assetId, benchmarkId, userId, elevate, req.userObject )
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

module.exports.setAssetStigGrants = async function setAssetStigGrants (req, res, next) {
  try {
    let assetId = req.params.assetId
    let benchmarkId = req.params.benchmarkId
    let body = req.body
    let elevate = req.query.elevate

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw new SmError.PrivilegeError()
    }
    const requesterCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the requester's granted accessLevel high enough?
    if ( elevate || (requesterCollectionGrant && requesterCollectionGrant.accessLevel >= 3) ) {
      // Verify all the userIds have accessLevel 1 on the Asset's Collection
      const collectionObj = await Collection.getCollection(assetToAffect.collection.collectionId, ['grants'], elevate, req.userObject)
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
      let response = await Asset.setAssetStigGrants(assetId, benchmarkId, body, elevate, req.userObject )
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

module.exports.updateAsset = async function updateAsset (req, res, next) {
  try {
    const elevate = req.query.elevate
    const assetId = req.params.assetId
    const projection = req.query.projection
    const body = req.body

    // If this user has no grants permitting access to the asset, the response will be undefined
    const currentAsset = await Asset.getAsset(assetId, projection, elevate, req.userObject )
    if (!currentAsset) {
      throw new SmError.PrivilegeError('User has insufficient privilege to modify this asset.')
    }
    // Check if the user has an appropriate grant to the asset's collection
    const currentCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === currentAsset.collection.collectionId )
    if ( !currentCollectionGrant || currentCollectionGrant.accessLevel < 3 ) {
      throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${currentAsset.collection.collectionId} to modify this asset.`)
    }
    // Check if the asset's collectionId is being changed
    const transferring = body.collectionId && currentAsset.collection.collectionId !== body.collectionId
    if (transferring) {
      // If so, Check if the user has an appropriate grant to the asset's updated collection
      const updatedCollectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )
      if ( !updatedCollectionGrant || updatedCollectionGrant.accessLevel < 3 ) {
        throw new SmError.PrivilegeError(`User has insufficient privilege in collectionId ${body.collectionId} to transfer this asset.`)
      }
    }
    const response = await Asset.updateAsset(
      assetId,
      body,
      projection,
      transferring,
      req.userObject
    )
    res.json(response)
  }
  catch (err) {
    next(err)
  }
}


async function getAssetIdAndCheckPermission(request) {
  const elevate = false
  let assetId = request.params.assetId

  // fetch the Asset for access control checks and the response
  let assetToAffect = await Asset.getAsset(assetId, [], elevate, request.userObject)
  // can the user fetch this Asset?
  if (!assetToAffect) {
    throw new SmError.PrivilegeError()
  }
  const collectionGrant = request.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
  // is the granted accessLevel high enough?
  if (!( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) )) {
    throw new SmError.PrivilegeError()
  }
  return assetId
}


module.exports.getAssetMetadata = async function (req, res, next) {
  try {
    let assetId = await getAssetIdAndCheckPermission(req)
    let result = await Asset.getAssetMetadata(assetId, req.userObject)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchAssetMetadata = async function (req, res, next) {
  try {
    let assetId = await getAssetIdAndCheckPermission(req)
    let metadata = req.body
    await Asset.patchAssetMetadata(assetId, metadata)
    let result = await Asset.getAssetMetadata(assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putAssetMetadata = async function (req, res, next) {
  try {
    let assetId = await getAssetIdAndCheckPermission(req)
    let body = req.body
    await Asset.putAssetMetadata(assetId, body)
    let result = await Asset.getAssetMetadata(assetId)
    res.json(result)
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getAssetMetadataKeys = async function (req, res, next) {
  try {
    let assetId = await getAssetIdAndCheckPermission(req)
    let result = await Asset.getAssetMetadataKeys(assetId, req.userObject)
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
    let assetId = await getAssetIdAndCheckPermission(req)
    let key = req.params.key
    let result = await Asset.getAssetMetadataValue(assetId, key, req.userObject)
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
    let assetId = await getAssetIdAndCheckPermission(req)
    let key = req.params.key
    let value = req.body
    let result = await Asset.putAssetMetadataValue(assetId, key, value)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}


module.exports.deleteAssetMetadataKey = async function (req, res, next) {
  try {
    let assetId = await getAssetIdAndCheckPermission(req)
    let key = req.params.key

    let result = await Asset.deleteAssetMetadataKey(assetId, key, req.userObject)
    res.status(204).send()
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getAssetLabels = async function (req, res, next) {
  try {
    res.json({})
  }
  catch (err) {
    next(err)
  }
}

module.exports.addAssetLabels = async function (req, res, next) {
  try {
    res.json({})
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceAssetLabels = async function (req, res, next) {
  try {
    res.json({})
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteAssetLabels = async function (req, res, next) {
  try {
    res.json({})
  }
  catch (err) {
    next(err)
  }
}

module.exports.deleteAssetLabelById = async function (req, res, next) {
  try {
    res.json({})
  }
  catch (err) {
    next(err)
  }
}
