'use strict';

var writer = require('../utils/writer.js');
var config = require('../utils/config')
var Asset = require(`../service/${config.database.type}/AssetService`);
const dbUtils = require(`../service/${config.database.type}/utils`)

module.exports.createAsset = async function createAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if (req.userObject.role == 'IAO' && !elevate && body.dept != req.userObject.dept) {
        // IAO can only create assets for their department
        writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to create asset with dept: ${body.dept}.`} ) )
        return
      }
      let response = await Asset.createAsset( body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 401, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteAsset = async function deleteAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
      // Must be elevated or IAO or Staff
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      if (req.userObject.role == 'IAO' && !elevate) {
        // Unelevated IAO, check if IAO can retreive Asset
        let assetToDelete = await Asset.getAsset(assetId, projection, elevate, req.userObject)
        if (!asssetToDelete) {
          writer.writeJson(res, writer.respondWithCode ( 401, {message: `User has insufficient privilege to complete this request.`} ) )
          return    
        }
      }
      let row = await Asset.deleteAsset( assetId, projection, elevate, req.userObject )
      writer.writeJson(res, r)
    }
  }
  catch (err) {
    writer.writeJson(res, err)
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
      let response = await Asset.setStigAssetsByBenchmarkId( benchmarkId, assetIds, projection, elevate, req.userObject )
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
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if (req.userObject.role == 'IAO' && !elevate) {
        // IAO can only update assets they can fetch
        let assetVerify = await Asset.getAsset(assetId, projection, elevate, req.userObject)
        if ( !assetVerify || assetVerify.dept !=  req.userObject.dept) {
          // Asset can't be fetched OR IAO is trying to set different department
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
          return
        }
      }
      let response = await Asset.updateAsset( assetId, body, projection, elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.replaceAsset = async function replaceAsset (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      if (req.userObject.role == 'IAO' && !elevate) {
        // IAO can only update assets they can fetch
        let assetVerify = await Asset.getAsset(assetId, projection, elevate, req.userObject)
        if ( !assetVerify || assetVerify.dept !=  req.userObject.dept) {
          // Asset can't be fetched OR IAO is trying to set different department
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
          return
        }
      }
      let response = await Asset.replaceAsset( assetId, body, projection, elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}
