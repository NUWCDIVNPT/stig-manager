'use strict';

var writer = require('../utils/writer.js');
var config = require('../utils/config')
var Asset = require(`../service/${config.database.type}/AssetService`);
const dbUtils = require(`../service/${config.database.type}/utils`)

module.exports.createAsset = async function createAsset (req, res, next) {
  if ( req.userObject.canAdmin || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
    try {
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if ((!req.userObject.canAdmin) && req.userObject.role == 'IAO' && body.dept != req.userObject.dept) {
        writer.writeJson(res, writer.respondWithCode ( 401, {message: `User has insufficient privilege to create asset with dept: ${body.dept}.`} ) )
        return
      }
      let response = await Asset.createAsset( body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  } 
  else {
    writer.writeJson(res, writer.respondWithCode ( 401, {message: "User has insufficient privilege to complete this request."} ) )
  }
}

module.exports.deleteAsset = async function deleteAsset (req, res, next) {
  if ( req.userObject.canAdmin || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
    try {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let assetToDelete = await Asset.getAsset(assetId, projection, true, req.userObject)

      // Check if IAO can delete this asset
      if (!req.userObject.canAdmin && req.userObject.role == 'IAO' && !assetToDelete) {
        writer.writeJson(res, writer.respondWithCode ( 401, {message: `User has insufficient privilege to complete this request.`} ) )
        return
      }

      await Asset.deleteAsset( assetId )
      writer.writeJson(res, assetToDelete)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  }
  else {
    writer.writeJson(res, writer.respondWithCode ( 401, {message: `User has insufficient privilege to complete this request.`} ) )    
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
    let packageId = req.swagger.params['packageId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let dept = req.swagger.params['dept'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Asset.getAssets(packageId, benchmarkId, dept, projection, elevate, req.userObject )
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
    let elevate = req.swagger.params['elevate'].value
    if (await dbUtils.userHasAssetStig(assetId, benchmarkId, elevate, req.userObject)) {
      let response = await Asset.getChecklistByAssetStig(assetId, benchmarkId, revisionStr, format, elevate, req.userObject )
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
  if ( req.userObject.canAdmin || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
    try {
      let benchmarkId = req.swagger.params['benchmarkId'].value
      let projection = req.swagger.params['projection'].value
      let elevate = req.swagger.params['elevate'].value
      let assetIds = req.swagger.params['body'].value

      if (req.userObject.role == 'IAO') {
      // Get the assets allowed to this IAO
        let iaoAssets = await Asset.getAssets(null, null, elevate ? null : req.userObject.dept, null, elevate, req.userObject)
        let iaoAssetList = iaoAssets.map(val => val.assetId)
        let assetCheck = assetIds.every(val => iaoAssetList.includes(val))
        if ( ! assetCheck ) {
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
          return
        }
      }
      let response = await Asset.setStigAssetsByBenchmarkId( benchmarkId, assetIds, projection, req.userObject )
      writer.writeJson(res, response)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  }
  else {
    writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
  }
}

module.exports.updateAsset = async function updateAsset (req, res, next) {
  if ( req.userObject.canAdmin || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
    try {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value

      // Check if IAO role has access to this asset
      if (req.userObject.role == 'IAO' && !req.userObject.canAdmin) {
        let assetVerify = await Asset.getAsset(assetId, projection, false, req.userObject)
        if ( !assetVerify ) {
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
          return
        }
      }
      let response = await Asset.updateAsset( assetId, body, projection, req.userObject )
      writer.writeJson(res, response)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  }
  else {
    writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
  }
}

module.exports.replaceAsset = async function updateAsset (req, res, next) {
  if ( req.userObject.canAdmin || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
    try {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value

      // Check if IAO role has access to this asset
      if (req.userObject.role == 'IAO' && !req.userObject.canAdmin) {
        let assetVerify = await Asset.getAsset(assetId, projection, false, req.userObject)
        if ( !assetVerify ) {
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
          return
        }
      }
      let response = await Asset.replaceAsset( assetId, body, projection, req.userObject )
      writer.writeJson(res, response)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  }
  else {
    writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
  }
}
