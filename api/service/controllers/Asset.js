'use strict';

var writer = require('../utils/writer.js');
var config = require('../utils/config')
var Asset = require(`../service/${config.database.type}/AssetService`);

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

module.exports.updateAsset = async function updateAsset (req, res, next) {
  if ( req.userObject.canAdmin || req.userObject.role == 'IAO' || req.userObject.role == 'Staff') {
    try {
      let assetId = req.swagger.params['assetId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.swagger.params['body'].value
      let assetToUpdate = await Asset.getAsset(assetId, projection, true, req.userObject)

      // Check if IAO can update this asset
      if (!req.userObject.canAdmin && req.userObject.role == 'IAO' && !assetToUpdate) {
        writer.writeJson(res, writer.respondWithCode ( 401, {message: `User has insufficient privilege to complete this request.`} ) )
        return
      }

      let response = await Asset.updateAsset( assetId, body, projection, req.userObject )
      writer.writeJson(res, response)
    }
    catch (err) {
      writer.writeJson(res, err)
    }
  }
  else {
    writer.writeJson(res, writer.respondWithCode ( 401, {message: `User has insufficient privilege to complete this request.`} ) )    
  }
}
