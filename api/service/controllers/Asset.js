'use strict';

var writer = require('../utils/writer.js');
var config = require('../utils/config')
var Asset = require(`../service/${config.database.type}/AssetService`);

module.exports.createAsset = function createAsset (req, res, next, body) {
  Asset.createAsset(body)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.deleteAsset = function deleteAsset (req, res, next, assetId) {
  Asset.deleteAsset(assetId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getAsset = function getAsset (req, res, next, assetId) {
  Asset.getAsset(assetId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getAssets = function getAssets (req, res, next, packageId, dept) {
  Asset.getAssets(packageId, dept)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.updateAsset = function updateAsset (req, res, next, body, assetId) {
  Asset.updateAsset(body, assetId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};
