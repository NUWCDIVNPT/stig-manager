'use strict';

var utils = require('../utils/writer.js');
var config = require('../utils/config')
var Asset = require(`../service/${config.database.type}/AssetService`);

module.exports.createAsset = function createAsset (req, res, next, body) {
  Asset.createAsset(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteAsset = function deleteAsset (req, res, next, assetId) {
  Asset.deleteAsset(assetId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAsset = function getAsset (req, res, next, assetId) {
  Asset.getAsset(assetId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAssets = function getAssets (req, res, next, packageId, dept) {
  Asset.getAssets(packageId, dept)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateAsset = function updateAsset (req, res, next, body, assetId) {
  Asset.updateAsset(body, assetId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
