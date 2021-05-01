'use strict';

const SmError = require('../utils/SmError')
const writer = require('../utils/writer');
const config = require('../utils/config')
const Asset = require(`../service/${config.database.type}/AssetService`);
const Collection = require(`../service/${config.database.type}/CollectionService`);
const dbUtils = require(`../service/${config.database.type}/utils`)
const J2X = require("fast-xml-parser").j2xParser
const he = require('he');

module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    let projection = req.swagger.params['projection'].value
    const body = req.swagger.params['body'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )

    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      try {
        let asset = await Asset.createAsset( body, projection, elevate, req.userObject)
        writer.writeJson(res, asset, 201)
      }
      catch (err) {
        // This is MySQL specific, should abstract with an SmError
        if (err.code === 'ER_DUP_ENTRY') {
          try {
            let response = await Asset.getAssets(body.collectionId, body.name, 'exact', null, null, projection, elevate, req.userObject )
            throw (writer.respondWithCode( 400, {
              code: 400,
              message: `Duplicate name`,
              data: response[0]
            }))
          } finally {}
        }
        else {
          throw err
        }
      }
    }
    else {
      // Not elevated or having collectionGrant
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteAsset = async function deleteAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let assetId = req.swagger.params['assetId'].value
    let projection = req.swagger.params['projection'].value

    // fetch the Asset for access control checks and the response
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      await Asset.deleteAsset( assetId, projection, elevate, req.userObject )
      writer.writeJson(res, assetToAffect)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.removeStigFromAsset = async function removeStigFromAsset (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeStigFromAsset(assetId, benchmarkId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.removeStigsFromAsset = async function removeStigsFromAsset (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, undefined, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeStigsFromAsset(assetId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.removeUserFromAssetStig = async function removeUserFromAssetStig (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let userId = req.swagger.params['userId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeUserFromAssetStig(assetId, benchmarkId, userId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.removeUsersFromAssetStig = async function removeUsersFromAssetStig (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.removeUsersFromAssetStig(assetId, benchmarkId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.exportAssets = async function exportAssets (projection, elevate, userObject) {
  try {
    let assets =  await Asset.getAssets(null, null, null, null, null, projection, elevate, userObject )
    return assets
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.getAsset = async function getAsset (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    
    // All users are permitted to query for the asset
    // If this user has no grants permitting access to the asset, the response will be undefined
    let response = await Asset.getAsset(assetId, projection, elevate, req.userObject )

    // If there is a response, check if the request included the stigGrants projection
    if (response && projection && projection.includes('stigGrants')) {
      // Check if the stigGrants projection is forbidden
      if (!elevate) {
        const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === response.collection.collectionId )
        if ((collectionGrant && collectionGrant.accessLevel < 3) || req.userObject.privileges.globalAccess ) {
          throw (writer.respondWithCode ( 403, {message: `User has insufficient privilege to request projection 'stigGrants'.`} ) )
        }
      }
    }
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAssets = async function getAssets (req, res, next) {
  try {
    const predicates = {

    }
    let collectionId = req.swagger.params['collectionId'].value
    let name = req.swagger.params['name'].value
    let nameMatch = req.swagger.params['name-match'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let metadata = req.swagger.params['metadata'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )

    if ( collectionGrant || req.userObject.privileges.globalAccess || elevate ) {
      // Check if the request includes the stigGrants projection
      if (projection && projection.includes('stigGrants')) {
        // Check if the stigGrants projection is forbidden
        if (!elevate) {
          if ((collectionGrant && collectionGrant.accessLevel < 3) || req.userObject.privileges.globalAccess ) {
            throw (writer.respondWithCode ( 403, {message: `User has insufficient privilege to request projection 'stigGrants'.`} ) )
          }
        }
      }
      let response = await Asset.getAssets(collectionId, name, nameMatch, benchmarkId, metadata, projection, elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getStigsByAsset = async function getStigsByAsset (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Asset.getStigsByAsset(assetId, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUsersByAssetStig = async function getUsersByAssetStig (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Asset.getUsersByAssetStig(assetId, benchmarkId, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getChecklistByAssetStig = async function getChecklistByAssetStig (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let revisionStr = req.swagger.params['revisionStr'].value
    let format = req.swagger.params['format'].value || 'json'
    if (await dbUtils.userHasAssetStigs(assetId, [benchmarkId], false, req.userObject)) {
      let response = await Asset.getChecklistByAssetStig(assetId, benchmarkId, revisionStr, format, false, req.userObject )
      if (format === 'json') {
        writer.writeJson(res, response)
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
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- STIG Manager ${config.version} -->\n`
        xml += j2x.parse(response.cklJs)
        writer.writeInlineFile(res, xml, `${response.assetName}-${benchmarkId}-${revisionStr}.ckl`, 'application/xml')
      }
    }
    else {
      writer.writeNoContent(res)
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getChecklistByAsset = async function getChecklistByAssetStig (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let requestedBenchmarkIds = req.swagger.params['benchmarkId'].value

    // If this user has no grants permitting access to the asset, the response will be undefined
    let assetResponse = await Asset.getAsset(assetId, ['stigs'], false, req.userObject )
    if (!assetResponse) {
      throw new SmError(403, 'User has insufficient access to complete this request.')
    }
    const availableBenchmarkIds = assetResponse.stigs.map( r => r.benchmarkId )
    if (availableBenchmarkIds.length === 0) {
      writer.writeNoContent(res)
      return
    }
    if (!requestedBenchmarkIds) {
      requestedBenchmarkIds = availableBenchmarkIds
    }
    else if (!requestedBenchmarkIds.every( requestedBenchmarkId => availableBenchmarkIds.includes(requestedBenchmarkId))) {
      throw new SmError(400, 'Asset is not mapped to all requested benchmarkIds')
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
    if (err.name === 'SmError') {
      writer.writeJson(req.res, { status: err.httpStatus, message: err.message }, err.httpStatus)
    }
    else {
        writer.writeJson(req.res, { status: 500, message: err.message, stack: err.stack }, 500)
    }
  }
}

module.exports.getAssetsByStig = async function getAssetsByStig (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let collectionId = req.swagger.params['collectionId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let projection = req.swagger.params['projection'].value

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || req.userObject.privileges.globalAccess || collectionGrant ) {
        let response = await Asset.getAssetsByStig( collectionId, benchmarkId, projection, elevate, req.userObject )
        writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.replaceAsset = async function replaceAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let assetId = req.swagger.params['assetId'].value
    let projection = req.swagger.params['projection'].value
    let body = req.swagger.params['body'].value

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.updateAsset( assetId, body, projection, elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.attachAssetsToStig = async function attachAssetsToStig (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let collectionId = req.swagger.params['collectionId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let assetIds = req.swagger.params['body'].value
    let projection = req.swagger.params['projection'].value

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let collection = await Collection.getCollection( collectionId, ['assets'], elevate, req.userObject)
      let collectionAssets = collection.assets.map( a => a.assetId)
      if (assetIds.every( a => collectionAssets.includes(a))) {
        await Asset.attachAssetsToStig( collectionId, benchmarkId, assetIds, projection, elevate, req.userObject )
        let response = await Asset.getAssetsByStig( collectionId, benchmarkId, projection, elevate, req.userObject )
        writer.writeJson(res, response)
      }
      else {
        throw( writer.respondWithCode ( 403, {message: `One or more assetId is not a Collection member.`} ) )
      }
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.attachStigToAsset = async function attachStigToAsset (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.attachStigToAsset(assetId, benchmarkId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.attachStigsToAsset = async function attachStigsToAsset (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let elevate = req.swagger.params['elevate'].value
    let body = req.swagger.params['body'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, [], elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.attachStigsToAsset(assetId, body, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.setAssetStigGrant = async function setAssetStigGrant (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let userId = req.swagger.params['userId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
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
        throw ( writer.respondWithCode ( 400, {message: `The user has an incompatible or missing grant in collectionId ${body.collectionId}.`} ) )
      }
      let response = await Asset.setAssetStigGrant(assetId, benchmarkId, userId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.setAssetStigGrants = async function setAssetStigGrants (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let body = req.swagger.params['body'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
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
          throw ( writer.respondWithCode ( 400, {message: `One or more users have incompatible or missing grants in collectionId ${body.collectionId}.`} ) )
        }
      }
      let response = await Asset.setAssetStigGrants(assetId, benchmarkId, body, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.updateAsset = async function updateAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let assetId = req.swagger.params['assetId'].value
    let projection = req.swagger.params['projection'].value
    let body = req.swagger.params['body'].value

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.updateAsset( assetId, body, projection, elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

