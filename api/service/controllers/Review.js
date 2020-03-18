'use strict';

var utils = require('../utils/writer.js');
var config = require('../utils/config')
var Review = require(`../service/${config.database.type}/ReviewService`);

module.exports.createReview = function createReview (req, res, next, body, projection) {
  Review.createReview(body, projection)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteReview = function deleteReview (req, res, next, reviewId, projection) {
  Review.deleteReview(reviewId, projection)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReview = function getReview (req, res, next, reviewId, projection, elevate) {
  Review.getReview(reviewId, projection, elevate)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReviews = function getReviews (req, res, next, projection, elevate, state, action, status, ruleId, benchmarkId, assetId, packageId) {
  Review.getReviews(projection, elevate, state, action, status, ruleId, benchmarkId, assetId, packageId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateReview = function updateReview (req, res, next, body, projection, reviewId) {
  Review.updateReview(body, projection, reviewId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
