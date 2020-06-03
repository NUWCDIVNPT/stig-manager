'use strict';

const writer = require('../utils/writer.js');
const config = require('../utils/config')
const Asset = require(`../service/${config.database.type}/AssetService`);
const User = require(`../service/${config.database.type}/UserService`);
const dbUtils = require(`../service/${config.database.type}/utils`)

module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.accessLevel >= 2 ) {
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if ( req.userObject.accessLevel === 2 && !elevate ) {
        if ( body.deptId !== req.userObject.dept.deptId ) {
          // Level 2 can only create assets for their department
          throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to create asset with deptId: ${body.deptId}.`} ) )
        }
        // Check stigReviewers to ensure only departmental users are requested
        if (body.stigReviewers) {
          let userIdsFromRequest = []
          for (sr of body.stigReviewers) {
            for (userId of sr.userIds) {
              userIdsFromRequest.push(userId)
            }
          }
          if (userIdsFromRequest.length > 0) {
            const deptUsers = await User.getUsers(null, null, null, null, false, req.userObject)
            const deptUserIds = deptUsers.map(u => u.userId)
            const allowed = userIdsFromRequest.every(i => deptUserIds.includes(i))
            if (! allowed) {
              // Level 2 can only map Users from their department
              throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to map non-department Users.`} ) )
            }
          }
        }
      }

      let asset = await Asset.createAsset( body, projection, elevate, req.userObject)    
      writer.writeJson(res, asset, 201)
    }
    else {
      // Not elevated or >= 2
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
    if ( elevate || req.userObject.accessLevel >= 2 ) {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      if (req.userObject.accessLevel === 2 && !elevate) {
        // Unelevated Level 2, check if user can fetch Asset
        let assetToDelete = await Asset.getAsset(assetId, projection, elevate, req.userObject)
        if (!assetToDelete) {
          throw ( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
        }
      }
      let row = await Asset.deleteAsset( assetId, projection, elevate, req.userObject )
      writer.writeJson(res, row)
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
    let assets =  await Asset.getAssets(null, null, null, projection, elevate, userObject )
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
    if (req.userObject.accessLevel <= 1 && !elevate) {
      if (projection && projection.includes('stigReviewers')) {
        throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to request projection 'stigReviewers'.`} ) )
      }
    }
    let response = await Asset.getAsset(assetId, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAssets = async function getAssets (req, res, next) {
  try {
    let packageId = req.swagger.params['packageId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let deptId = req.swagger.params['deptId'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    if (req.userObject.accessLevel <= 1 && !elevate) {
      if (projection && projection.includes('stigReviewers')) {
        throw (writer.respondWithCode ( 403, {message: `User has insufficient privilege to request projection 'stigReviewers'.`} ) )
      }
    }
    let response = await Asset.getAssets(packageId, benchmarkId, deptId, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAssetsByBenchmarkId = async function getAssets (req, res, next) {
  try {
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    if (req.userObject.accessLevel <= 1 && !elevate) {
      if (projection && projection.includes('reviewers')) {
        throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to request projection 'reviewers'.`} ) )
      }
    }
    let response = await Asset.getAssetsByBenchmarkId( benchmarkId, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getChecklistByAssetStig = async function getAssets (req, res, next) {
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

module.exports.setStigAssetsByBenchmarkId = async function setStigAssetsByBenchmarkId (req, res, next) {
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

module.exports.updateAsset = async function updateAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.accessLevel >= 2 ) {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if (!elevate && req.userObject.accessLevel === 2) {
        await verifyDeptUpdateOrReplace(assetId, body, req.userObject)
      }
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

module.exports.replaceAsset = async function replaceAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.accessLevel >= 2 ) {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if (!elevate && req.userObject.accessLevel === 2) {
        await verifyDeptUpdateOrReplace(assetId, body, req.userObject)
      }
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

async function verifyDeptUpdateOrReplace (assetId, body, userObject) {
  try {
    // Level 2 can only update assets they can fetch.
    let currentAsset = await Asset.getAsset(assetId, ['stigReviewers'], false, userObject)
    if ( ! currentAsset ) {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    // Level 2 can't change the deptId of an Asset
    if ( body.deptId && body.deptId !== userObject.dept.deptId ) {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to update deptId: ${body.dept.deptId}.`} ) )
    }
    // Level 2 can only map stigReviewers with userIds from their department 
    // UNLESS the stigReviewer is already mapped
    if (body.stigReviewers) {
      // Get the departmental userIds with 1
      const deptUsers = await User.getUsers(1, null, null, null, false, userObject)
      const deptUserIds = deptUsers.map(u => u.userId)

      // From the earlier call to getAsset(), build an object of current stigReviewers
      // currentStigUsers = { BENCHMARKID: [userId, userId, userId], ... }
      const currentStigUsers = {}
      for (const sr of currentAsset.stigReviewers) {
        if (!currentStigUsers[sr.benchmarkId]) { currentStigUsers[sr.benchmarkId] = [] }
        for (const reviewers of sr.reviewers) {
            currentStigUsers[sr.benchmarkId].push(reviewers.userId)
        }
      }
      // From body.stigReviewers, build an object of proposed stigReviewers
      // proposedStigUsers = { BENCHMARKID: [userId, userId, userId], ... }
      let proposedStigUsers = {}
      for (const sr of body.stigReviewers) {
        if (!proposedStigUsers[sr.benchmarkId]) { proposedStigUsers[sr.benchmarkId] = [] }
        proposedStigUsers[sr.benchmarkId] = sr.userIds
      }

      // Iterate through proposedStigUsers looking for prohibited userIds
      const benchmarkIds = Object.keys(proposedStigUsers)
      for (const benchmarkId of benchmarkIds) {
        // Get any new userIds not currently mapped to the STIG
        const newIds = proposedStigUsers[benchmarkId].filter( userId => !currentStigUsers[benchmarkId].includes(userId) )
        for (const newId of newIds) {
          const allowed = deptUserIds.includes(newId)
          // 2 can only map new Users from their department
          if (!allowed) {
            throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to map userId: ${newId} to ${benchmarkId}.`} ) )
          }
        }
      }
    }
    return true
  }
  catch (err) {
    throw (err)
  }
}
