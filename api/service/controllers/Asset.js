'use strict';

var writer = require('../utils/writer.js');
var config = require('../utils/config')
var Asset = require(`../service/${config.database.type}/AssetService`);

module.exports.createAsset = async function createAsset (req, res, next) {
}

module.exports.deleteAsset = async function deleteAsset (req, res, next) {
}

module.exports.getAsset = async function getAsset (req, res, next) {
  let assetId = req.swagger.params['assetId'].value
  let projection = req.swagger.params['projection'].value
  let elevate = req.swagger.params['elevate'].value
  try {
    let response = await Asset.getAsset(assetId, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAssets = async function getAssets (req, res, next) {
  let packageId = req.swagger.params['packageId'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let dept = req.swagger.params['dept'].value
  let projection = req.swagger.params['projection'].value
  let elevate = req.swagger.params['elevate'].value
  try {
    let response = await Asset.getAssets(packageId, benchmarkId, dept, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.updateAsset = function updateAsset (req, res, next) {
  Asset.updateAsset(body, assetId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};
