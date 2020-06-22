'use strict';

const writer = require('../utils/writer.js');
const config = require('../utils/config')
const Asset = require(`../service/${config.database.type}/AssetService`);
const Collection = require(`../service/${config.database.type}/CollectionService`);
const dbUtils = require(`../service/${config.database.type}/utils`)

module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    let projection = req.swagger.params['projection'].value
    const body = req.swagger.params['body'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === body.collectionId )

    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      // // Does collectionId exist?
      // const collectionObj = await Collection.getCollection(body.collectionId, ['grants'], elevate, req.userObject)
      // if (!collectionObj) {
      //   throw ( writer.respondWithCode ( 400, {message: `Invalid property value "collectionId": ${body.collectionId}`} ) )
      // }
      // // Check stigGrants to ensure only users with collectionGrants are requested
      // if (body.stigGrants) {
      //   let userIdsFromRequest = []
      //   for (const sr of body.stigGrants) {
      //     for (const userId of sr.userIds) {
      //       userIdsFromRequest.push(userId)
      //     }
      //   }
      //   if (userIdsFromRequest.length > 0) {
      //     // Filter out users with incompatible grants (accessLevels != 1)
      //     const collectionUsers = collectionObj.grants.filter(g => g.accessLevel === 1)
      //     const collectionUserIds = collectionUsers.map(g => g.user.userId)
      //     // Check every requested userId
      //     const allowed = userIdsFromRequest.every(i => collectionUserIds.includes(i))
      //     if (! allowed) {
      //       // Can only map Users with an existing grant
      //       throw ( writer.respondWithCode ( 400, {message: `One or more users have incompatible or missing grants in collectionId ${body.collectionId}.`} ) )
      //     }
      //   }
      // }
      let asset = await Asset.createAsset( body, projection, elevate, req.userObject)    
      writer.writeJson(res, asset, 201)
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

module.exports.deleteAssetStig = async function deleteAssetStig (req, res, next) {
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
      let response = await Asset.deleteAssetStig(assetId, benchmarkId, elevate, req.userObject )
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

module.exports.deleteAssetStigs = async function deleteAssetStigs (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let elevate = req.swagger.params['elevate'].value

    // fetch the Asset for access control checks
    let assetToAffect = await Asset.getAsset(assetId, projection, elevate, req.userObject)
    // can the user fetch this Asset?
    if (!assetToAffect) {
      throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === assetToAffect.collection.collectionId )
    // is the granted accessLevel high enough?
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Asset.deleteAssetStigs(assetId, elevate, req.userObject )
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

module.exports.deleteAssetStigGrant = async function deleteAssetStigGrant (req, res, next) {
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
      let response = await Asset.deleteAssetStigGrant(assetId, benchmarkId, userId, elevate, req.userObject )
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

module.exports.deleteAssetStigGrants = async function deleteAssetStigGrants (req, res, next) {
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
      let response = await Asset.deleteAssetStigGrants(assetId, benchmarkId, elevate, req.userObject )
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
    let assets =  await Asset.getAssets(null, null, projection, elevate, userObject )
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
    let response = await Asset.getAsset(assetId, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAssets = async function getAssets (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )

    if ( elevate || req.userObject.privileges.globalAccess || collectionGrant ) {
      // For now, lower accessLevels can't see other reviewers
      if (collectionGrant && collectionGrant.accessLevel < 3 && !elevate) {
        if (projection && projection.includes('stigGrants')) {
          throw (writer.respondWithCode ( 403, {message: `User has insufficient privilege to request projection 'stigGrants'.`} ) )
        }
      }
      let response = await Asset.getAssets(collectionId, benchmarkId, projection, elevate, req.userObject )
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

module.exports.getAssetStigs = async function getAssetStigs (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Asset.getAssetStigs(assetId, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAssetStigGrants = async function getAssetStigGrants (req, res, next) {
  try {
    let assetId = req.swagger.params['assetId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Asset.getAssetStigGrants(assetId, benchmarkId, elevate, req.userObject )
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
    if (await dbUtils.userHasAssetStig(assetId, benchmarkId, false, req.userObject)) {
      let response = await Asset.getChecklistByAssetStig(assetId, benchmarkId, revisionStr, format, false, req.userObject )
      if (format === 'json') {
        writer.writeJson(res, response)
      }
      else {
        writer.writeXml(res, response, `${benchmarkId}-${revisionStr}-${assetId}.ckl`)
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

module.exports.replaceStigAssetsByBenchmarkId = async function replaceStigAssetsByBenchmarkId (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let assetIds = req.swagger.params['body'].value
    let projection = req.swagger.params['projection'].value

    if (elevate || req.userObject.accessLevel >= 2) {
      if (req.userObject.accessLevel === 2 && !elevated) {
        // Level 2 can only change the mapped Assets from their department
        // E.g. If the request incudes an empty asset array, then only departmental assets are unmapped
        // Get all assets currently mapped to this STIG by making an internal elevated request
        let currentAssetMap = await Asset.getAssetsByBenchmarkId(benchmarkId, null, true, req.userObject)
        // Filter into dept and non-dept arrays
        let currentAssetIds = {
          nonDept: currentAssetMap.filter(a => a.dept.deptId !== req.userObject.dept.deptId),
          dept: currentAssetMap.filter(a => a.dept.deptId === req.userObject.dept.deptId)
        }
        // Get departmental assets
        let deptAssets = await Asset.getAssets(null, null, null, null, elevate, req.userObject)
        let deptAssetIds = deptAssets.map(a => a.assetId)
        // Check there are not any non-dept assets in the request
        let assetCheck = assetIds.every(a => deptAssetIds.includes(a))
        if ( ! assetCheck ) {
          throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to map non-department Assets.`} ) )
        }
        // Re-write the request assetIds by concatenating the current non-dept assets with the new dept assets
        assetIds = currentAssetIds.nonDept.concat(assetIds) 
      }
      let response = await Asset.setStigAssetsByBenchmarkId( benchmarkId, assetIds, projection, elevate, req.userObject )
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

module.exports.setAssetStig = async function setAssetStig (req, res, next) {
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
      let response = await Asset.setAssetStig(assetId, benchmarkId, elevate, req.userObject )
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

module.exports.setAssetStigs = async function setAssetStigs (req, res, next) {
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
      let response = await Asset.setAssetStigs(assetId, body, elevate, req.userObject )
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

